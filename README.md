# Odyssey

Odyssey is a travel journaling web application. Users can create journals with photos and locations, explore public journals, and view travel entries on a map and timeline.

## Project components

- **Frontend:** React 18, TypeScript, Vite 6, Tailwind CSS, React Router, Leaflet
- **Backend:** Java 17, Spring Boot 3.2, Spring Security, Spring Data JPA, MySQL
- **Frontend development URL:** http://localhost:3000
- **Backend URL:** http://localhost:9090

## Requirements

- Node.js 20 and npm
- Java 17 and Maven
- MySQL 8

## Run locally

### Backend

From the repository root, open PowerShell and run:

```powershell
Set-Location odyssey-backend
$env:DB_URL = "jdbc:mysql://localhost:3306/odyssey_db?allowPublicKeyRetrieval=true&useSSL=false&createDatabaseIfNotExist=true"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-local-mysql-password"
$env:JWT_SECRET = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
mvn spring-boot:run
```

The database connection and JWT signing key are read from environment variables. Set `DB_PASSWORD` to match your local MySQL account. `JWT_SECRET` must be a random key of at least 32 bytes. The optional `JWT_EXPIRATION` value is in milliseconds and defaults to one day.

### Frontend

In a second terminal:

```powershell
Set-Location odyssey-frontend
npm ci
Copy-Item .env.example .env.local
```

Add a Geoapify API key to `.env.local` for location autocomplete, then start Vite:

```powershell
npm run dev
```

Vite runs on port `3000` and proxies `/api` requests to the backend on port `9090`.

## Configuration and secrets

Backend configuration variables:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRATION` (optional; milliseconds)

Frontend configuration uses `VITE_GEOAPIFY_API_KEY`. Vite embeds `VITE_*` values in browser assets, so restrict this key in Geoapify's settings. Keep `.env` files and production credentials out of Git. Use the checked-in `.env.example` as a template.

The application currently has no Google Gemini or OpenRouter integration. If an AI provider is added, its API key must be configured as a backend environment variable and requests must go through the backend; never expose it through a `VITE_*` variable.

Changing `JWT_SECRET` invalidates existing login tokens. Configure the new value in the deployment environment when rotating it.

## Checks and CI

GitHub Actions runs frontend lint, typecheck, and production build, plus backend Maven verification, on pushes and pull requests to `dev` and `main`.

```powershell
Set-Location odyssey-frontend
npm ci
npm run lint
npm run typecheck
npm run build

Set-Location ../odyssey-backend
mvn --batch-mode --no-transfer-progress verify
```

There are currently no automated frontend or backend test files. Maven verification compiles and packages the backend and reports “No tests to run.”

## Repository layout

- `odyssey-frontend/` — React application and Vite configuration
- `odyssey-backend/` — Spring Boot application and Maven build
- `database_indexes.sql` — optional database index definitions
- `.github/workflows/ci.yml` — CI checks
- `LICENSE` — GNU General Public License v3.0

## License

Odyssey is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License v3.0 as published by the Free Software Foundation.

- Full license text: see [`LICENSE`](./LICENSE)
- Copyright (C) 2026 vishnuendla
- Learn more: <https://www.gnu.org/licenses/gpl-3.0.html>
