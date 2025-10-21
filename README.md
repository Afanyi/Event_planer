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

#### Running Tests

