# 📅 Events Planner (MongoDB + Docker)

**Events Planner** is a minimal full-stack application to create, view, filter, and manage events (title, description, location, date/time, tags, participants).

**Freestyle feature:** the backend can derive geo data (e.g., `lat`, `lon`) from addresses and optionally fetch a short weather/forecast summary for the event’s time/location (via OpenWeatherMap).  
**Tests:** the repo includes unit and integration tests for both backend (Jest/Supertest) and frontend (Jest + React Testing Library), with optional Docker test containers.

---

## ✨ Features

- CRUD for Events (+ tags & participants)
- Search & filters (query string, date range, location, tags)
- Optional derived geo fields and forecast summary (OpenWeatherMap)
- TypeScript across the stack (Node/Express/Mongoose + React/Vite)
- Dockerized services (MongoDB, API, Frontend)
- Unit & Integration tests (backend and frontend)

---

## 🗂 Project Structure
    ├─ backend/ # Express + Mongoose (TypeScript)
    ├─ frontend/ # React + Vite (TypeScript)
    ├─ docker-compose.yml
    ├─ .gitlab-ci.yml
    └─ README.md

## 🚀 Quick Start

### Prerequisites

- Docker
- Docker Compose
    ```env
    # Backend
    MONGO_URI=mongodb://mongo:27017/eventsdb
    PORT=4000
    CORS_ORIGIN=http://localhost:5173
    # OpenWeatherMap (required for freestyle weather/forecast)
    OWM_API_KEY=YOUR_OPENWEATHERMAP_API_KEY

# Frontend build (optional override)
VITE_API_BASE=http://localhost:4000/api

### Steps

1. Clone the repository:

   ```bash
   git clone git@code.fbi.h-da.de:blasiusfornge.afanyi/fwe-ws-25-26-1126782.git
   cd fwe-ws-25-26-1126782

2. Build and start the Docker containers
    ```bash
    docker compose up --build

3. The application will be accessible at the following endpoints:
    - Backend (API): http://localhost:4000
    - Frontend (UI): http://localhost:5173
    - MongoDB (local/Compass): connect to mongodb://127.0.0.1:27018

4. Stop & clean:
   ```bash
   docker compose down
   # remove db volume too (CAUTION: deletes data)
    docker compose down -v

#### key Parts
##### Database(MongoDB)
- Runs MongoDB 7 with a named volume mongo_data for persistence.
- Exposes MongoDB only on 127.0.0.1:27018 (safe for local use; not public).
- Healthcheck ensures Mongo is ready before API starts.
#### backend
- Express + Mongoose server (TypeScript).
- Reads DB connection, CORS origin, and OWM_API_KEY from environment.
- Waits for mongo (healthcheck) and serves API on http://localhost:4000.
- Freestyle feature uses OWM_API_KEY to compute an optional forecast summary.
- main components controllers, middleware, models, routes, services, utils
- folder str
- 
- backend/
    ```bash
  ├─ reports/
  ├─ src/
  │ ├─ controllers/
  │ ├─ middlewares/
  │ ├─ models/
  │ ├─ routes/
  │ ├─ services/
  │ ├─ utils/
  │ ├─ app.ts
  │ ├─ db.ts
  │ ├─ index.ts
  │ └─ types.ts
  ├─ tests/
  │ ├─ helpers/
  │ ├─ integration/
  │ └─ unit/
  ├─ .env.example
  ├─ Dockerfile
  ├─ jest.config.ts
  ├─ jest.int.config.ts
  ├─ package.json
  ├─ package-lock.json
  ├─ tsconfig.jest.json
  └─ tsconfig.json

#### frontend
- Built with Vite and served by a minimal Nginx image in the resulting container.
- Uses build arg VITE_API_BASE to configure the API base URL.
- Serves the app at http://localhost:5173
- frontend/
  ```bash
    ├─ dist/
    ├─ node_modules/ # Library root
    ├─ src/
    │ ├─ components/
    │ └─ tests/
    │ ├─ api.ts
    │ ├─ App.tsx
    │ ├─ main.tsx
    │ ├─ setupTests.ts
    │ ├─ styles.css
    │ └─ types.ts
    ├─ Dockerfile
    ├─ index.html
    ├─ jest.config.ts
    ├─ package.json
    ├─ package-lock.json
    ├─ tsconfig.json
    ├─ vite.config.ts
    └─ vite-env.d.ts

#### backend-test / frontend-test
- Minimal, ephemeral containers to run CI-style tests (npm run test:ci).
- Set CI=true and write reports to /reports (mount a host dir to persist).


#### volumes
- mongo_data stores MongoDB data between container restarts.


