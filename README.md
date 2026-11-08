# Odyssey

[![CI](https://github.com/vishnuendla/odyssey/actions/workflows/ci.yml/badge.svg)](https://github.com/vishnuendla/odyssey/actions/workflows/ci.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE)

A full-stack travel journaling platform for documenting, sharing and reliving trips. Write rich journal entries with photos and places, browse other travellers' public stories, and see every journey laid out on an interactive map and timeline.

![Odyssey home page](docs/screenshots/01-home.png)

## Features

- **Travel journals** — create, edit and delete entries with a title, story text, cover photos and a tagged location.
- **Photo galleries** — upload images per journal; files are stored by the backend and served through `/api/storage/files/...`.
- **Interactive maps** — Leaflet maps show journal locations, with automatic geocoding and autocomplete powered by Geoapify.
- **Timeline view** — see your trips ordered chronologically with locations and reaction/comment counts.
- **Explore** — a public feed of every public journal with search, location filters and recent/oldest/popular sorting.
- **Social interactions** — reactions and comments on journals, with author names and avatars.
- **Sharing** — shareable links for public journals, and visibility control (public vs private) per entry.
- **Accounts** — email/password registration and JWT authentication stored in an HTTP-only cookie.
- **Dark mode and responsive layout** — usable from a phone to a desktop.

## Screenshots

| Explore public journals | Journal page |
| --- | --- |
| ![Explore](docs/screenshots/02-explore.png) | ![Journal view](docs/screenshots/03-public-journal-view.png) |

| Interactive map | Timeline |
| --- | --- |
| ![Map](docs/screenshots/04-map.png) | ![Timeline](docs/screenshots/10-timeline.png) |

| Create a journal | Your journals |
| --- | --- |
| ![Create journal](docs/screenshots/07-create-journal.png) | ![My journals](docs/screenshots/06-my-journals.png) |

| Profile | Mobile |
| --- | --- |
| ![Profile](docs/screenshots/11-profile.png) | ![Mobile home](docs/screenshots/12-mobile-home.png) |

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, Leaflet, TanStack Query |
| Backend | Java 17, Spring Boot 3.2, Spring Security (JWT), Spring Data JPA, Hibernate, Maven |
| Database | MySQL 8 |
| Geocoding | Geoapify autocomplete and geocoding APIs |
| CI | GitHub Actions (frontend lint/typecheck/build, backend Maven verify) |

## Getting started

### Requirements

- Node.js 20+ and npm
- Java 17+ and Maven
- MySQL 8 running locally

### 1. Backend

```powershell
Set-Location odyssey-backend
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-local-mysql-password"
$env:JWT_SECRET  = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
mvn spring-boot:run
```

The backend starts on <http://localhost:9090> and creates the `odyssey_db` database and tables on first run (`createDatabaseIfNotExist=true` plus Hibernate `ddl-auto=update`).

### 2. Frontend

```powershell
Set-Location odyssey-frontend
npm ci
Copy-Item .env.example .env.local
# put your Geoapify key in .env.local
npm run dev
```

Open <http://localhost:3000>. Vite proxies `/api` requests to the backend on port `9090`.

### Environment variables

| Variable | Where | Required | Purpose |
| --- | --- | --- | --- |
| `DB_URL` | backend | no | JDBC URL, defaults to `jdbc:mysql://localhost:3306/odyssey_db?...` |
| `DB_USERNAME` | backend | no | Database user, defaults to `root` |
| `DB_PASSWORD` | backend | yes | Database password |
| `JWT_SECRET` | backend | yes | HMAC key for signing tokens, at least 32 bytes |
| `JWT_EXPIRATION` | backend | no | Token lifetime in ms, defaults to one day |
| `VITE_GEOAPIFY_API_KEY` | frontend | yes | Location autocomplete and geocoding |

`VITE_*` values are embedded in the browser bundle, so treat the Geoapify key as public and restrict it in the Geoapify dashboard. Never put provider secrets in a `VITE_*` variable — backend-only keys belong in backend environment variables.

## API overview

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | public | Create an account |
| POST | `/api/auth/login` | public | Sign in and receive the `odyssey-token` cookie |
| POST | `/api/auth/logout` | public | Clear the auth cookie |
| GET | `/api/auth/me` | user | Current profile |
| GET | `/api/auth/users/{id}` | user | Author profile |
| GET | `/api/journals` | user | All journals |
| GET | `/api/journals/public` | public | Paged public journals |
| GET | `/api/journals/my` | user | Journals owned by the caller |
| GET | `/api/journals/{id}` | public | Single journal (private entries visible to the owner only) |
| POST | `/api/journals` | user | Create a journal |
| PUT | `/api/journals/{id}` | user | Update a journal |
| DELETE | `/api/journals/{id}` | user | Delete a journal |
| GET | `/api/journals/{id}/reactions` | user | Reaction summary |
| POST | `/api/journals/{id}/comments` | user | Add a comment |
| POST | `/api/storage/upload` | user | Upload journal images |
| GET | `/api/storage/files/{file}` | public | Serve an uploaded image |
| GET | `/api/locations/search?q=` | user | Location search |

## Project structure

```text
odyssey/
├── odyssey-backend/          Spring Boot API
│   ├── src/main/java/com/odyssey/
│   │   ├── config/           Security, CORS, JWT and cache configuration
│   │   ├── controller/       REST endpoints
│   │   ├── dto/              Request/response models
│   │   ├── entity/           JPA entities
│   │   ├── repository/       Spring Data repositories
│   │   ├── security/         JWT filter and providers
│   │   └── service/          Business logic
│   └── uploads/              Uploaded journal images
├── odyssey-frontend/         React application
│   └── src/
│       ├── components/       UI, layout and feature components
│       ├── contexts/         Auth and journal state
│       ├── pages/            Route-level screens
│       ├── services/         API client
│       └── utils/            Geocoding and helpers
├── docs/screenshots/         README screenshots
├── database_indexes.sql      Optional index definitions
└── .github/workflows/ci.yml  CI pipeline
```

## Checks and CI

GitHub Actions runs on every push and pull request to `dev` and `main`:

```powershell
Set-Location odyssey-frontend
npm ci
npm run lint
npm run typecheck
npm run build

Set-Location ../odyssey-backend
mvn --batch-mode --no-transfer-progress verify
```

There are currently no automated frontend or backend test files; Maven verification compiles and packages the backend.

## Troubleshooting

- **`invalid flag: --release`** while building the backend — Maven is running on JDK 8. Point `JAVA_HOME` at a JDK 17+ installation.
- **`Access denied for user 'root'@'localhost'`** — set `DB_PASSWORD` to your local MySQL password before starting the backend.
- **A journal card shows the placeholder graphic** — that entry has no photo, or its uploaded file is missing from `odyssey-backend/uploads/`. Missing images fall back to `public/placeholder.svg` instead of a broken-image icon.
- **Location search returns nothing** — `VITE_GEOAPIFY_API_KEY` is missing or restricted in `.env.local`; restart Vite after changing env values.
- **`401`/`403` on private pages after changing `JWT_SECRET`** — old cookies are invalid, sign in again.

## License

Odyssey is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License v3.0 as published by the Free Software Foundation.

- Full license text: see [`LICENSE`](./LICENSE)
- Copyright (C) 2026 vishnuendla
- Learn more: <https://www.gnu.org/licenses/gpl-3.0.html>
