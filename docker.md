# Docker & CI/CD Documentation

## Overview
This document summarizes the Docker configuration for the **QuanLyKinhDoanh** project, covering both the **backend** (FastAPI) and **frontend** (React/Vite) services, the **docker‑compose** orchestrator, and the associated GitHub Actions workflows that build and deploy the containers to a VPS.

---
### 1. Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (mysqlclient, build tools, …)
RUN apt-get update && apt-get install -y \
    pkg-config \
    default-libmysqlclient-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Start the FastAPI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```
*Runs on Python 3.10‑slim, installs required system libs, then launches `uvicorn`.*

---
### 2. Frontend Dockerfile (`frontend/Dockerfile`)
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies and build the React/Vite app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build   # outputs static assets into ./dist

# ==== Production stage using Nginx ==== 
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# (Optional) custom Nginx config can be added
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
*The multistage build compiles the React app, then serves the static files with a lightweight Nginx container.*

---
### 3. Docker‑Compose (`docker-compose.yml`)
```yaml
version: "3.9"
services:
  backend:
    build:
      context: ./backend
    env_file:
      - ./backend/.env          # DATABASE_URL, SECRET_KEY, …
    ports:
      - "8000:8000"
    restart: unless-stopped
    depends_on:
      - db

  frontend:
    build:
      context: ./frontend
    ports:
      - "80:80"
    restart: unless-stopped
    depends_on:
      - backend

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
    volumes:
      - mysql-data:/var/lib/mysql
    ports:
      - "3306:3306"

volumes:
  mysql-data:
```
*Runs three containers (backend, frontend, MySQL) on the same network. The `depends_on` ensures proper startup order.*

---
### 4. CI Workflow (`.github/workflows/ci.yml`)
*Builds and pushes Docker images to Docker Hub on every push to `main`.*
```yaml
name: CI
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - name: Build & push backend image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/quan-ly-kinh-doanh-backend:latest
      - name: Build & push frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/quan-ly-kinh-doanh-frontend:latest
```
---
### 5. CD Workflow (`.github/workflows/cd.yml`)
*Deploys the freshly built images to your VPS via SSH.*
```yaml
name: CD
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up SSH
        uses: webfactory/ssh-agent@v0.5.4
        with:
          ssh-private-key: ${{ secrets.VPS_SSH_PRIVATE_KEY }}
      - name: Pull & restart containers on VPS
        run: |
          ssh -o StrictHostKeyChecking=no ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} << 'EOF'
            cd /path/to/your/project
            git pull origin main
            docker compose pull
            docker compose up -d --remove-orphans
          EOF
```
---
### 6. Quick VPS Setup (one‑line script)
```bash
# Install Docker & Docker‑Compose (Ubuntu/Debian)
sudo apt-get update && sudo apt-get install -y ca-certificates curl gnupg lsb-release && \
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \
 echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null && \
 sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io && \
 sudo mkdir -p /usr/libexec/docker/cli-plugins && \
 sudo curl -SL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 -o /usr/libexec/docker/cli-plugins/docker-compose && \
 sudo chmod +x /usr/libexec/docker/cli-plugins/docker-compose && \
 sudo usermod -aG docker $USER && newgrp docker
```
After connecting again, run:
```bash
cd /path/to/QuanLyKinhDoanh
docker compose pull
docker compose up -d
```
---
### 7. Useful Commands
- `docker compose logs -f backend` – tail backend logs
- `docker compose exec backend /bin/bash` – open a shell inside the backend container
- `docker compose down` – stop and remove containers (useful for clean rebuild)

---
**End of docker.md**
