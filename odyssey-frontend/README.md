# Odyssey Frontend

React 18 and TypeScript single-page application for creating and exploring travel journals.

## Requirements

- Node.js 20 and npm
- A running Odyssey backend at `http://localhost:9090`
- A Geoapify key for location autocomplete

## Setup

From `odyssey-frontend/`:

```powershell
npm ci
Copy-Item .env.example .env.local
```

Set `VITE_GEOAPIFY_API_KEY` in `.env.local`, then start the frontend:

```powershell
npm run dev
```

Vite serves the app at http://localhost:3000 and proxies `/api` requests to `http://localhost:9090`. `VITE_*` values are included in browser assets; restrict the Geoapify key in the provider console.

## Available commands

```powershell
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run preview
```

Automated tests use Vitest and Testing Library (`npm run test`). GitHub Actions runs lint, typecheck, tests, and build on pushes and pull requests to `dev` and `main`.

## Related files

- `src/` — pages, components, contexts, and API services
- `public/` — static assets
- `vite.config.ts` — port, aliases, and backend proxy
- `.env.example` — local environment template
