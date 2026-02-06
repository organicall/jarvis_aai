# Jarvis Meeting Prep (Redo)

## Setup
1. Install dependencies:
   - `npm install`
2. Run backend + frontend together:
   - `npm run dev:all`

## Notes
- The Groq proxy runs at `http://localhost:8787`.
- The frontend uses the proxy by default. Override with `VITE_API_BASE` if needed.
- The proxy reads `GROQ_API_KEY` from `.env` (already set to your current key).

## Scripts
- `npm run server` starts the proxy only
- `npm run dev` starts the frontend only
- `npm run dev:all` starts both
