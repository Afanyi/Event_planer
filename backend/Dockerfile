# ---- Stage 1: Deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# ---- Stage 2: Test (neu) ----
FROM node:20-alpine AS test
WORKDIR /app
ENV CI=true
# Defaults – in CI/Compose kannst du diese per -e überschreiben
ENV JEST_JUNIT_OUTPUT_DIR=/reports \
    JEST_JUNIT_OUTPUT_NAME=junit.xml \
    COVERAGE_DIR=/reports/coverage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY tsconfig.json ./
COPY src ./src
# Standardkommando; kann in docker compose überschrieben werden
CMD sh -lc "npm run test:ci"

# ---- Stage 3: Build (TS -> dist) ----
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Stage 4: Runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund
EXPOSE 4000
CMD ["node", "dist/index.js"]
