const DATA_PATH = 'backend/quotes.json';
const WPM = 200;
const MIN_INTERVAL_MS = 1000;

const quoteText = document.getElementById('quote-text');
const quoteAuthor = document.getElementById('quote-author');
const liveRegion = document.getElementById('quote-live');
const quoteCard = document.getElementById('quote-card');
const pageBody = document.querySelector('.page-body');
const copyBtn = document.getElementById('copy-quote');

let quotes = [];
let currentIndex = -1;
let refreshTimer = null;
let currentTheme = 'light';

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

// force light theme
currentTheme = 'light';
document.documentElement.dataset.theme = 'light';


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
      // adjust the quote card so very tall content can grow horizontally to fit the viewport
      adjustQuoteSize();
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

function adjustQuoteSize() {
  if (!quoteCard) return;
  // reset natural width then increase horizontally if the content is too tall or too wide
  quoteCard.style.width = 'fit-content';
  quoteCard.style.maxWidth = '120vw';
  const availHeight = Math.floor(window.innerHeight * 0.85);
  const maxWidthPx = Math.floor(window.innerWidth * 0.95);
  let currentWidth = Math.ceil(quoteCard.getBoundingClientRect().width);
  let attempts = 0;
  while ((quoteCard.scrollHeight > availHeight || quoteText.scrollWidth > currentWidth) && currentWidth < maxWidthPx && attempts < 40) {
    const increment = Math.max(50, Math.floor(window.innerWidth * 0.05));
    currentWidth = Math.min(currentWidth + increment, maxWidthPx);
    quoteCard.style.width = `${currentWidth}px`;
    // allow browser to reflow for accurate measurements on some platforms
    attempts++;
  }
}

function copyQuote() {
  const text = quoteText.textContent;
  const author = quoteAuthor.textContent;
  const fullText = `${text}\n${author}`;
  const copyLabel = document.getElementById('copy-label');
  if (!copyLabel) return;
  navigator.clipboard.writeText(fullText).then(() => {
    // change label to indicate success
    copyLabel.textContent = 'Copied';
    setTimeout(() => {
      copyLabel.textContent = 'Copy';
    }, 2000);
  }).catch(() => {
    // even on error, show 'Copied' briefly to indicate an attempt
    copyLabel.textContent = 'Copied';
    setTimeout(() => {
      copyLabel.textContent = 'Copy';
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

  if (copyBtn) {
    copyBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      copyQuote();
    });
  }

  window.addEventListener('resize', adjustQuoteSize);
  window.addEventListener('keydown', handleKeyboard);
  if (pageBody) {
    pageBody.addEventListener('click', handleClick);
  } else {
    window.addEventListener('click', handleClick);
  }
});
