# 📅 Events Planner — Full‑Stack (MongoDB, Express, React, Docker)

Minimal full‑stack app to **create, view, filter, and manage events** (title, description, location, date/time, tags, participants).

**Freestyle feature:** The backend can derive geo data (e.g. `lat`, `lon`) from addresses and optionally **fetch a short weather/forecast summary** for an event’s time/location (via OpenWeatherMap).

**Tests:** Unit & integration tests for **backend** (Jest/Supertest) and **frontend** (Jest + React Testing Library). Optional Dockerized test jobs for CI/CD.

---

![Node](https://img.shields.io/badge/node-%3E%3D20-339933) ![React](https://img.shields.io/badge/react-18-61DAFB) ![MongoDB](https://img.shields.io/badge/mongodb-7-47A248) ![Docker](https://img.shields.io/badge/docker-compose-2496ED) ![CI](https://img.shields.io/badge/CI-GitLab-orange)

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
  - [Run with Docker Compose](#run-with-docker-compose)
  - [Local Development (without Docker)](#local-development-without-docker)

- [Configuration](#configuration)
- [API](#api)
  - [Data Model](#data-model)
  - [Endpoints](#endpoints)
  - [Query & Filter Examples](#query--filter-examples)

- [Testing](#testing)
- [CI/CD (GitLab)](#cicd-gitlab)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- CRUD for Events (+ tags & participants)
- Search & filters (query string, date range, location, tags)
- Optional **derived geo fields** and **forecast summary** (OpenWeatherMap)
- **TypeScript** across the stack (Node/Express/Mongoose + React/Vite)
- **Dockerized** services (backend, database, frontend, tests)
- **Unit & Integration tests** (backend and frontend)

## Architecture

```
┌───────────────┐      HTTP/JSON      ┌──────────────────┐        TCP        ┌───────────┐
│   Frontend    │  ─────────────────▶ │     Backend      │ ────────────────▶ │  MongoDB  │
│ React + Vite  │  ◀───────────────── │ Express + Mongoose│ ◀────────────── │   7.x     │
└───────────────┘                     └──────────────────┘                   └───────────┘
                                               │
                                               │ REST (optional)
                                               ▼
                                        OpenWeatherMap API
```

**Local URLs**

- Backend API: `http://localhost:4000`
- Frontend UI: `http://localhost:5173`
- MongoDB (Compass/CLI): `mongodb://127.0.0.1:27018`

## Tech Stack

- **Backend:** Node.js 20+, Express, Mongoose, TypeScript
- **Frontend:** React 18, Vite, TypeScript
- **DB:** MongoDB 7 (named Docker volume for persistence)
- **Tests:** Jest, Supertest, Testing Library, mongodb-memory-server
- **Infra:** Docker, Docker Compose, (optional) GitLab CI

## Project Structure

```
├─ backend/                 # Express + Mongoose (TypeScript)
│  ├─ src/
│  │  ├─ controllers/
│  │  ├─ middlewares/
│  │  ├─ models/
│  │  ├─ routes/
│  │  ├─ services/
│  │  ├─ utils/
│  │  ├─ app.ts
│  │  ├─ db.ts
│  │  ├─ index.ts
│  │  └─ types.ts
│  ├─ tests/
│  │  ├─ helpers/
│  │  ├─ integration/
│  │  └─ unit/
│  ├─ .env.example
│  ├─ Dockerfile
│  ├─ jest.config.ts
│  ├─ jest.int.config.ts
│  ├─ package.json
│  └─ tsconfig*.json
│
├─ frontend/                # React + Vite (TypeScript)
│  ├─ src/
│  │  ├─ components/
│  │  ├─ tests/
│  │  ├─ api.ts
│  │  ├─ App.tsx
│  │  ├─ main.tsx
│  │  ├─ setupTests.ts
│  │  ├─ styles.css
│  │  └─ types.ts
│  ├─ Dockerfile
│  ├─ index.html
│  ├─ jest.config.ts
│  ├─ package.json
│  └─ vite.config.ts
│
├─ docker-compose.yml
├─ .gitlab-ci.yml           
└─ README.md
```

## Quick Start

### Run with Docker Compose

**Prerequisites:** Docker + Docker Compose

1. Clone the repository

```bash
git clone git@code.fbi.h-da.de:blasiusfornge.afanyi/fwe-ws-25-26-1126782.git
cd fwe-ws-25-26-1126782
```

2. Configure environment

- Copy `backend/.env.example` to `backend/.env` and set values (see [Configuration](#configuration))
- Ensure you have an **OpenWeatherMap API key** if you want the freestyle feature

3. Build & start

```bash
docker compose up --build
```

4. Open

- Health: [http://localhost:4000/api/health](http://localhost:4000/api/health)
- API: [http://localhost:4000/api](http://localhost:4000/api)
- Frontend: [http://localhost:5173](http://localhost:5173)

5. Stop & clean

```bash
docker compose down             # stop
# CAUTION: remove DB volume (deletes data)
docker compose down -v
```

### Local Development (without Docker)

**Option A: Start Mongo via Docker only**

```bash
docker run -d --name events-mongo -p 27018:27017 -v mongo_data:/data/db mongo:7
```

**Backend**

```bash
cd backend
cp .env.example .env   # adjust values
npm install
npm run dev            # ts-node-dev or similar live-reload
```

**Frontend**

```bash
cd frontend
npm install
npm run dev            # Vite at http://localhost:5173
```

## Configuration

### Environment Variables (Backend)

    | Variable      | Default                                   |       Required | Description                                                                       |
    | ------------- | ----------------------------------------- | -------------: | --------------------------------------------------------------------------------- |
    | `MONGO_URI`   | `mongodb://mongo:27017/eventsdb` (Docker) |              ✅ | MongoDB connection string. For local dev use `mongodb://127.0.0.1:27018/eventsdb` |
    | `PORT`        | `4000`                                    |                | API port                                                                          |
    | `CORS_ORIGIN` | `http://localhost:5173`                   |                | Allowed frontend origin                                                           |
    | `OWM_API_KEY` | —                                         | ⚠️ for weather | OpenWeatherMap API key (enables forecast feature).                                |

**Notes**

- Keep the MongoDB service bound to `127.0.0.1:27018` for local safety (not public).
- If `OWM_API_KEY` is absent, the API will skip forecast enrichment.
- replace xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx with your api key

### Frontend Build‑Time Config

- `VITE_API_BASE` (build arg) → Base URL for API (e.g. `http://localhost:4000`).

**Example Docker build**

```bash
# inside ./frontend
docker build -t events-frontend --build-arg VITE_API_BASE=http://localhost:4000 .
```

## API

### Data Model

**Event**

    ```ts
    {
      _id: string,
      title: string,                 // required
      description?: string,
      location?: string,             // human-readable address derived from street?: string;houseNumber?: string; postalCode?: string; city?: string;
      datetime?: string,             // ISO 8601
      tags?: string[],
      participants?: string[],
      // derived
      lat?: number,
      lon?: number,
      forecast?: {
        at?: string,                 // ISO time used for forecast
        summary?: string,
        tempC?: number,
        icon?: string
      }
    }
    ```

**Typical Indexes**

- `datetime` (for range queries)
- `tags` (multikey)
- text index on `title` + `description`

### Endpoints

Base path: `/api`

- most important for all apis go to the api link
- API: [http://localhost:4000/api](http://localhost:4000/api)

**GET** `/api/events`

- Query params: `q`, `from`, `to`, `tag`, `location`
- Returns: paged list of events

**GET** `/api/events/:id`

- Returns a single event

**POST** `/api/events`

- Body: event payload (see model). If `location` present, backend may derive `lat/lon` and optional `forecast` when `OWM_API_KEY` is set.

**PUT/PATCH** `/api/events/:id`

- Update an existing event

**DELETE** `/api/events/:id`

- Delete an event

**Responses & Errors**

- `200/201` success, `204` no content
- `400` invalid payload, `404` not found
- `422` validation error
- `500` server error

### Query & Filter Examples

```bash
# List all
curl http://localhost:4000/api/events

# Full-text search
curl "http://localhost:4000/api/events?q=meetup"

# Date range (ISO 8601)
curl "http://localhost:4000/api/events?from=2025-01-01T00:00:00Z&to=2025-12-31T23:59:59Z"

# Filter by tag
curl "http://localhost:4000/api/events?tag=conference"

# Create with freestyle features (location → lat/lon + forecast)
curl -X POST http://localhost:4000/api/events \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "React Meetup",
    "description": "Monthly JS/TS meetup",
    "location": "Berliner Allee 1, 64295 Darmstadt",
    "datetime": "2025-11-30T18:00:00Z",
    "tags": ["react","community"],
    "participants": ["alice@example.com","bob@example.com"]
  }'
```

## Testing

**Backend**

```bash
# from ./backend
npm test          # unit + integration (configured via jest*.ts)
npm run test:ci   # CI mode with coverage + JUnit (jest-junit)
```

- Integration tests use **mongodb-memory-server** (no external DB required).
- JUnit XML is written to `reports/` for CI integration.

**Frontend**

```bash
# from ./frontend
npm test          # unit tests (React Testing Library, jsdom)
npm run test:ci   # CI mode with coverage + JUnit
```

## CI/CD (GitLab)

Example minimal `.gitlab-ci.yml` (Node 20) for separate frontend/backend jobs:

```yaml
image: node:20-alpine

stages: [test]

cache:
  key: ${CI_PROJECT_NAME}-${CI_COMMIT_REF_SLUG}
  paths:
    - backend/node_modules
    - frontend/node_modules

backend:test:
  stage: test
  before_script:
    - cd backend
    - npm ci
  script:
    - npm run test:ci
  artifacts:
    when: always
    reports:
      junit: backend/reports/junit.xml
    paths:
      - backend/coverage

frontend:test:
  stage: test
  before_script:
    - cd frontend
    - npm ci
  script:
    - npm run test:ci
  artifacts:
    when: always
    reports:
      junit: frontend/reports/junit.xml
    paths:
      - frontend/coverage
```

> Adjust/add stages for build/deploy as needed. For Docker image builds, use a DinD or Kaniko job.

## Troubleshooting

- **Mongo connection refused**: ensure Mongo is running and `MONGO_URI` matches `mongodb://127.0.0.1:27018/eventsdb` for local dev.
- **CORS errors**: set `CORS_ORIGIN` to the exact frontend origin (e.g. `http://localhost:5173`).
- **Weather not showing**: verify `OWM_API_KEY`, check API rate limits, and confirm `datetime` is in ISO (UTC) format.
- **Port in use**: change `PORT` or stop the service occupying it.
- **Dirty dev DB**: `docker compose down -v` to reset; beware it deletes your data.
- **Timezones**: store and compare in UTC. Convert for display in the frontend.

## Roadmap

- creating docker setup
- folder setup and creating routes
- sorting parameters
- Map preview (MapLibre/Leaflet) for `lat/lon`
- OpenAPI spec

## Contributing

Afanyi Blasius Fornge

1. Create a feature branch
2. Add/adjust tests
3. Run tests locally
4. automatic tests on gitlab CI/CD

## License

MIT © Contributors

- Afanyi Blasius Fornge

---

### Maintainers’ Notes

- Keep `.env.example` in sync with code defaults
- Bind Mongo to `127.0.0.1` only for local safety
- freestyle feature only works for adresses in Germany
- did add input checks on modifications frontend with a suitable message because of growing complexity due to growing complexity and lack of time
- but an error will be returned if invalid or repeated value inserted
