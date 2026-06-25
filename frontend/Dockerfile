FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies and build the React/Vite app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ==== Production stage using Nginx ==== 
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Optional custom nginx config (if needed)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
