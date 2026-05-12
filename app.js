const DATA_PATH = 'backend/quotes.json';
const WPM = 200;
const MIN_INTERVAL_MS = 1000;

const quoteText = document.getElementById('quote-text');
const quoteAuthor = document.getElementById('quote-author');
const liveRegion = document.getElementById('quote-live');
const quoteCard = document.getElementById('quote-card');
const pageBody = document.querySelector('.page-body');
const themeToggle = document.getElementById('theme-toggle');
const copyBtn = document.getElementById('copy-quote');

let quotes = [];
let currentIndex = -1;
let refreshTimer = null;
let currentTheme = 'dark';

const fallbackQuotes = [
  { text: 'The way you think when nobody is watching is the only truth you can trust.', author: 'Unknown' },
  { text: 'Most of what we fear never happens, and most of what happens we could have prepared for.', author: 'Marcus Aurelius' },
  { text: 'The easiest prison to escape is the one inside your own head.', author: 'Seneca' },
  { text: 'Growth begins where comfort ends.', author: 'Unknown' },
  { text: 'A mind that is stretched by a new idea never returns to its original size.', author: 'Oliver Wendell Holmes' }
];

function loadQuotes() {
  return fetch(DATA_PATH, { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch quote data');
      }
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Quote file is empty or invalid');
      }
      quotes = data;
    });
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function computeIntervalMs(text) {
  const words = countWords(text);
  const seconds = Math.ceil((words / WPM) * 60);
  return Math.max(seconds * 1000, MIN_INTERVAL_MS);
}

function applyTheme(theme) {
  currentTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = currentTheme;
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', currentTheme === 'light' ? 'false' : 'true');
    themeToggle.setAttribute('aria-label', `Switch to ${currentTheme === 'light' ? 'dark' : 'light'} theme`);
  }
  localStorage.setItem('quotes-theme', currentTheme);
}

function initTheme() {
  const savedTheme = localStorage.getItem('quotes-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
}

function toggleTheme() {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function pickNextIndex() {
  if (!quotes.length) {
    return 0;
  }

  let nextIndex;
  const maxAttempts = 8;
  let attempts = 0;

  do {
    nextIndex = Math.floor(Math.random() * quotes.length);
    attempts += 1;
  } while (nextIndex === currentIndex && attempts < maxAttempts);

  return nextIndex;
}

function showQuote(index) {
  const quote = quotes[index];
  if (!quote || !quote.text) {
    return;
  }

  currentIndex = index;
  quoteCard.classList.add('fade-out');

  window.requestAnimationFrame(() => {
    setTimeout(() => {
      quoteText.textContent = quote.text;
      quoteAuthor.textContent = quote.author ? `— ${quote.author}` : '— Unknown';
      liveRegion.textContent = `Quote by ${quote.author || 'Unknown'}: ${quote.text}`;
      quoteCard.classList.remove('fade-out');
      resetTimer(quote.text);
    }, 120);
  });
}

function resetTimer(text) {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  refreshTimer = setTimeout(() => {
    showQuote(pickNextIndex());
  }, computeIntervalMs(text));
}

function refreshQuote() {
  if (!quotes.length) {
    quotes = fallbackQuotes;
  }
  const nextIndex = pickNextIndex();
  showQuote(nextIndex);
}

function handleKeyboard(event) {
  if (event.code === 'Space' || event.key === ' ') {
    event.preventDefault();
    refreshQuote();
  }
}

function handleClick() {
  refreshQuote();
}

function copyQuote() {
  const text = quoteText.textContent;
  const author = quoteAuthor.textContent;
  const fullText = `${text}\n${author}`;
  const icon = document.getElementById('copy-icon');
  if (!icon) return;
  navigator.clipboard.writeText(fullText).then(() => {
    icon.innerHTML = '<svg class="icon-check" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';
    setTimeout(() => {
      icon.innerHTML = '<svg class="icon-clipboard" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="4" width="6" height="4" rx="1"/><rect x="5" y="8" width="14" height="12" rx="2"/><path d="M9 4V2h6v2"/></svg>';
    }, 2000);
  });
}

function showErrorMessage() {
  quoteText.textContent = 'Unable to load quotes from the backend. Showing a fallback quote instead.';
  quoteAuthor.textContent = '';
  liveRegion.textContent = 'Unable to load quotes. Showing fallback content.';
  quotes = fallbackQuotes;
  currentIndex = -1;
  resetTimer('Unable to load quotes from the backend. Showing a fallback quote instead.');
}

document.addEventListener('DOMContentLoaded', () => {
  loadQuotes().then(() => {
    refreshQuote();
  }).catch(() => {
    showErrorMessage();
  });

  initTheme();
  if (themeToggle) {
    themeToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleTheme();
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      copyQuote();
    });
  }

  window.addEventListener('keydown', handleKeyboard);
  if (pageBody) {
    pageBody.addEventListener('click', handleClick);
  } else {
    window.addEventListener('click', handleClick);
  }
});
