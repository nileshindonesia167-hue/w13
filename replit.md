# Blink Beyond

Digital marketing agency website for Blink Beyond, based in Palghar, Maharashtra, India.

## Tech Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript
- **Animations**: GSAP (GreenSock) with ScrollTrigger and Draggable
- **Backend**: Node.js custom HTTP server (`server.js`)
- **AI**: OpenAI `gpt-4o-mini` powering an AI Voice Agent (requires `OPENAI_API_KEY` secret)

## Pages
- `/` — Homepage (hero, services preview, work cards, testimonials)
- `/about.html` — About the agency
- `/services.html` — Full services listing
- `/contact.html` — Contact form (Formspree)
- `/404.html` — Custom 404

## Running the App
```
npm run dev
```
Starts the server on port 5000.

## Environment Variables
- `OPENAI_API_KEY` — Required for the AI Voice Agent feature. Set via Replit Secrets.

## Key Files
- `server.js` — HTTP server + `/api/agent` POST endpoint for the AI voice agent
- `js/main.js` — All UI, GSAP animations, page loader, balloon game
- `js/agent.js` — AI Voice Agent controller (STT → OpenAI → TTS)
- `css/style.css` — Core styles
- `css/enhancements.css` — Animations, responsive overrides

## User Preferences
- Expert coder / engineer buddy tone — direct, precise, no fluff
- Navbar and announcement strip must stay the same width (`92vw`, `max-width: 860px`) and same border-radius (`12px`) — matching the OSMO-style stacked pill design
