# Gracia Visitor App

A visitor companion web app for Gracia Farm: events, activities, shops, an interactive farm map with GPS positioning, and an AI avatar assistant that answers questions from the farm's live data.

> **Demo project.** All data is stored in the visitor's browser (localStorage) and seeded with sample content. There is no shared database, and staff login is not secure — don't use it for real data.

## Features

- **Visitor app** — home, events (with booking), activities, shops with live open/closed status, about, profile.
- **AI assistant** — floating avatar and full chat page, with voice input/output. Uses retrieval-augmented generation (RAG): each question retrieves the most relevant events, activities, shops, zones, announcements, FAQs and policies (BM25 ranking with stemming, synonyms and follow-up context), and a local LLM (Ollama) answers from them. Works offline in a basic mode that answers directly from the retrieved documents.
- **GPS signal processing on the map** — raw phone GPS fixes pass through outlier rejection (Mahalanobis gating against multipath), a constant-velocity Kalman filter, a least-squares georeference onto the farm map, and zone detection with hysteresis. A built-in simulated walk compares raw vs filtered tracks against the true path.
- **Admin panel** (`/admin`) — manage events, activities, shops, zones/closures, announcements and staff, with role-based permissions.

## Tech stack

React 18, Vite, Tailwind CSS, TanStack Query, Framer Motion · Node.js + Express AI backend · Ollama · Jest

## Getting started

Requires Node.js 18+.

```bash
npm install
npm run dev            # http://localhost:3001
```

### AI backend (optional)

Without it, the assistant runs in basic mode. To use the LLM:

```bash
# Install Ollama (https://ollama.com) and pull a chat model, e.g.
ollama pull llama3.2:3b

cd backend
npm install
npm start              # http://localhost:3002
```

The backend picks the first installed model from its preference list; set `MODEL=<name>` to choose one, and `DEBUG_RAG=1` to log retrieved documents.

### Configuration

Create a `.env` file in the project root if you need to change defaults (never commit it):

| Variable | Default | Purpose |
|---|---|---|
| `VITE_AI_API_URL` | `http://localhost:3002/api/ai` | AI backend URL |
| `VITE_AI_TIMEOUT_MS` | `60000` | Max wait without AI output |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | — | Optional; not used by the demo data layer |
| `VITE_WEATHER_API_KEY` | — | Optional OpenWeatherMap key |

### Demo logins

Staff portal (`/login?portal=staff`): `admin@gracia.farm` / `admin123`. Other roles: `events@`, `content@`, `support@gracia.farm` with `events123`, `content123`, `support123`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build to `dist/` |
| `npm test` | Run unit tests |
| `npm run lint` | Lint with ESLint |

## Map calibration

GPS-to-map conversion uses surveyed control points in `src/data/geoReference.js`. The repository ships with placeholder points; survey 3+ landmarks on site (instructions in the file) for real-world accuracy.

## Project structure

```
src/            API services, AI retrieval (lib/rag.js), GPS processing (lib/positioning.js), hooks, UI kit, tests
Pages/          Visitor and admin pages
Components/     Feature components (AI avatar, map overlay, cards)
backend/        Express AI server (RAG + Ollama)
supabase/       Database schema (for a future shared backend)
Entities/       Data model definitions
public/         Static assets and service worker
```
