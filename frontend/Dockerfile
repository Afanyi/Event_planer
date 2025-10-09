# ---- Stage 1: Deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# ---- Stage 2: Build (Vite) ----
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY tsconfig.json vite.config.ts index.html ./
COPY vite-env.d.ts ./
COPY src ./src

# API-Basis als Build-Arg entgegennehmen (kommt aus docker-compose.yml)
ARG VITE_API_BASE=http://localhost:4000/api
ENV VITE_API_BASE=$VITE_API_BASE

RUN npm run build

# ---- Stage 3: Runtime (nginx) ----
FROM nginx:alpine
# Statisches Build ausliefern
COPY --from=build /app/dist /usr/share/nginx/html
# Für SPAs ggf. History-Fallback konfigurieren (optional):
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
