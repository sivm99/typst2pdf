# ----------- Backend Builder ----------
FROM oven/bun:alpine AS backend-builder
WORKDIR /app
COPY --link package.json bun.lock ./
RUN bun i --ci
COPY . .
RUN bun run build


# ----------- Frontend Builder ----------
FROM oven/bun:alpine AS frontend-builder
WORKDIR /app/frontend
COPY --link frontend/package.json frontend/bun.lock ./
RUN bun i --ci
COPY --link frontend ./
RUN bun run build


# ----------- Final Runtime Image ----------
FROM oven/bun:alpine
WORKDIR /app

# Install Typst CLI
RUN apk -U upgrade && apk add typst

# Copy backend build output
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/package.json ./

# Copy frontend build output
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Optional: clean start, only start built server
EXPOSE 6969
CMD ["bun", "run", "start"]
