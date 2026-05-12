# Quotes

A minimal static webapp that shows one random quote at a time and refreshes automatically based on the quotes read-time estimate.

## Files

- `index.html` — frontend entry point
- `styles.css` — responsive, accessible styling
- `app.js` — quote loading, timer logic, and manual refresh controls
- `backend/quotes.json` — read-only quote dataset served from the same origin

## Hosting

Deploy the project to any static host. Ensure `backend/quotes.json` is available at runtime from the same origin as `index.html` using the relative path `backend/quotes.json`.

Open `index.html` in a browser to see a random quote, auto-refresh after a computed interval, and manual refresh by clicking or pressing the Space key.
