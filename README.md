# 📅 Events Planner — Full‑Stack (MongoDB, Express, React, Docker)

Minimal full‑stack app to **create, view, filter, and manage events** (title, description, location, date/time, tags, participants).

**Freestyle feature:** The backend can derive geo data (e.g. `lat`, `lon`) from addresses and optionally **fetch a short weather/forecast summary** for an event’s time/location (via OpenWeatherMap).

**Tests:** Unit & integration tests for **backend** (Jest/Supertest) and **frontend** (Jest + React Testing Library). Optional test jobs for CI/CD.

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



## 🧱 Entities & Relationships

The system is based on five entities that are connected through *many-to-many relationships*.

### 🧩 Event

Represents a single event (with title, description, location, date, image).

Relationships:

* *1:N* to Tag → connects events with tags.
* *1:N* to Participant → connects events with participants.

### 🏷️ Tag

Defines categories or labels that can be assigned to an event.

Relationships:

* *1:N* to Event.

### 👥 Participant

Represents a person who participates in one or more events.

Relationships:

* *1:N* to Event.



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
Here is a tabular description of the API routes for the **Events Backend**, as requested:
    
    | **Method** | **Path**                                      | **Description**                                                                             |
    | ---------- | --------------------------------------------- | ------------------------------------------------------------------------------------------- |
    | DELETE     | `/api/events`                                 | Deletes all events from the system with ids provided.                                                         |
    | GET        | `/api/events`                                 | Retrieves a list of all events, with optional query parameters for filtering.               |
    | POST       | `/api/events`                                 | Creates a new event. The event details are provided in the request body.                    |
    | DELETE     | `/api/events/:id`                             | Deletes a specific event identified by its `id`.                                            |
    | GET        | `/api/events/:id`                             | Retrieves a single event by its `id`.                                                       |
    | PUT        | `/api/events/:id`                             | Updates a specific event identified by its `id` with the provided data in the request body. |
    | DELETE     | `/api/events/:id/participants/:participantId` | Removes a participant from an event by their `id`.                                          |
    | POST       | `/api/events/:id/participants/:participantId` | Adds a participant to an event, identified by the event and participant's `id`.             |
    | DELETE     | `/api/events/:id/tags/:tagId`                 | Removes a tag from an event by its `id`.                                                    |
    | POST       | `/api/events/:id/tags/:tagId`                 | Adds a tag to an event, identified by the event's and tag's `id`.                           |
    | GET        | `/api/events/:id/weather`                     | Fetches weather information for the event, using the event's location and datetime.         |
    | GET        | `/api/events/by-participant/:participantId`   | Retrieves a list of events for a specific participant identified by their `participantId`.  |
    | GET        | `/api/events/by-tag/:tagId`                   | Retrieves a list of events filtered by a specific tag identified by its `tagId`.            |
    | GET        | `/api/health`                                 | Health check endpoint to verify if the backend is running correctly.                        |
    | DELETE     | `/api/participants`                           | Deletes all participants from the system with ids provided.                                                   |
    | GET        | `/api/participants`                           | Retrieves a list of all participants in the system.                                         |
    | POST       | `/api/participants`                           | Creates a new participant.                                                                  |
    | DELETE     | `/api/participants/:id`                       | Deletes a specific participant identified by their `id`.                                    |
    | GET        | `/api/participants/:id`                       | Retrieves a specific participant by their `id`.                                             |
    | PUT        | `/api/participants/:id`                       | Updates a specific participant's details, identified by their `id`.                         |
    | DELETE     | `/api/tags`                                   | Deletes all tags from the system with ids provided.                                                           |
    | GET        | `/api/tags`                                   | Retrieves a list of all tags in the system.                                                 |
    | POST       | `/api/tags`                                   | Creates a new tag.                                                                          |
    | DELETE     | `/api/tags/:id`                               | Deletes a specific tag by its `id`.                                                         |
    | GET        | `/api/tags/:id`                               | Retrieves a specific tag by its `id`.                                                       |
    | PUT        | `/api/tags/:id`                               | Updates a specific tag's details, identified by its `id`.                                   |

---



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

Here is a more detailed and complex roadmap for the **Events Planner** project, breaking down tasks into specific actions:

---

## Roadmap

### 1. **Docker Setup**

* **Objective:** Create a production-grade Docker setup for the entire application stack (backend, frontend, and database) to ensure seamless deployment and testing.
* **Tasks:**

    * Write Dockerfiles for the **backend** and **frontend**.
    * Set up a `docker-compose.yml` file to handle multi-container deployment (backend, frontend, MongoDB, and optional services).
    * Configure persistent MongoDB data using Docker volumes.
    * Set up health checks for backend and database containers.
    * Implement build optimizations for Docker layers (multi-stage builds for production-ready images).
    * Add necessary **environment variable configurations** (`.env`) for different environments (local, test, production).
    * Set up a **CI/CD pipeline** to automate the building, testing, and deployment of Docker containers.

### 2. **Folder Setup and Creating Routes**

* **Objective:** Organize the project into modular and maintainable folders. Implement the core routes to handle CRUD operations and business logic.
* **Tasks:**

    * **Folder Structure Setup:**

        * Organize backend into logical modules: controllers, routes, services, models, middlewares, and utils.
        * Separate frontend components into logical sections (e.g., components, services, pages, utilities).
    * **Create Express Routes:**

        * Implement RESTful routes for handling events, participants, and tags (refer to API specification).
        * Include query parameter handling for filtering events by date, location, tags, etc.
        * Set up middleware for request validation.
        * Implement **authentication/authorization** (JWT-based or session-based).
    * **Error Handling and Validation:**

        * Set up global error handling for unexpected errors.
        * Implement proper validation for incoming data (e.g., check for missing fields, invalid data types).
        * Return appropriate HTTP status codes for errors (`400`, `404`, `500`, etc.).

### 3. **Sorting Parameters and Advanced Filters**

* **Objective:** Implement advanced sorting and filtering features for event listings.
* **Tasks:**

    * **Date Range Filtering:**

        * Implement sorting and filtering by event date (start and end date range).
        * Allow the frontend to query for events occurring in a specific time frame.
    * **Tag Filtering:**

        * Implement tag-based filtering (events with specific tags).
        * Enable multi-tag filtering (e.g., events that have both “Business” and “Tech” tags).
    * **Location-Based Filtering:**

        * Implement location-based filtering (e.g., events within a certain radius of a location).
        * Use **GeoJSON** data for more advanced spatial queries (e.g., using MongoDB’s geospatial queries).


### 4. **Map Preview (MapLibre/Leaflet) for `lat/lon`**

* **Objective:** Integrate a map preview for events based on their derived `lat` and `lon` coordinates to display event locations.
* **Tasks:**

    * **Frontend Map Integration:**

        * Integrate **MapLibre** or **Leaflet** to display maps on event detail pages.
        * Create interactive markers for events on the map, using event coordinates (`lat`, `lon`).
        * Allow zooming and panning to view events on the map.
    * **Display Event Location:**

        * Display event locations with markers, custom icons, and popups showing event details when clicked.
    * **Geocoding & Reverse Geocoding:**

        * Integrate a geocoding service (e.g., **Nominatim API**, **OpenCage API**) to convert addresses into geographical coordinates.
    * **Map Clustering:**

        * Implement clustering for events if there are many events in close proximity to avoid overlapping markers.
    * **Frontend State Management:**

        * Use **Redux** or **Context API** for state management to pass event data and map settings between components.


### 5. **Unit & Integration Testing for Backend and Frontend**

* **Objective:** Ensure the stability and reliability of both backend and frontend by writing tests for business logic, components, and API interactions.
* **Tasks:**

    * **Backend Testing (Jest, Supertest):**

        * Write unit tests for service functions, such as creating, updating, and deleting events.
        * Write integration tests to test API endpoints, ensuring they work as expected with the database.
        * Use **mongodb-memory-server** for testing database interactions without needing a live MongoDB instance.
    * **Frontend Testing (Jest, React Testing Library):**

        * Write unit tests for React components to verify that they render correctly and handle user interactions.
        * Use **React Testing Library** to test user interactions, ensuring components respond to state changes properly.
    * **CI Integration:**

        * Set up continuous integration pipelines to automatically run tests on push and pull request events.
        * Configure **JUnit reports** to integrate test results into the CI/CD pipeline.

### 6. **Continuous Deployment (CD) with GitLab CI/CD**

* **Objective:** Set up automated deployment pipelines to facilitate continuous integration and continuous delivery.
* **Tasks:**

    * **Automated Build and Test Pipelines:**

        * Set up GitLab CI/CD pipelines to automatically build and test Docker images for both backend and frontend.
        * Run unit and integration tests on every commit.
    * **Docker Image Builds:**

        * Automate the building of Docker images for both frontend and backend with multi-stage Dockerfiles.
        * Push the images to a container registry (e.g., DockerHub, GitLab Container Registry).
    * **Staging & Production Environments:**

        * Set up deployment pipelines to automatically deploy to **staging** and **production** environments based on Git tags or branches.
        * Ensure the staging environment mirrors production, and deploy to production only after tests pass.


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
