# Odyssey Frontend

React 18 and TypeScript single-page application for creating and exploring travel journals.

## Requirements

- Node.js 20 and npm
- A running Odyssey backend at `http://localhost:9090`

## Setup

From `odyssey-frontend/`:

```powershell
npm ci
npm run dev
```

The frontend needs no environment variables of its own: geocoding and the Geoapify key live on the backend, which the browser only reaches through `/api`.

Vite serves the app at http://localhost:3000 and proxies `/api` requests to `http://localhost:9090`.

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
