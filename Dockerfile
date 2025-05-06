FROM oven/bun:alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --production
COPY . .
RUN bun run build

FROM oven/bun:alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
RUN apk -U upgrade
RUN apk add typst
EXPOSE 6969
CMD ["bun", "run", "start"]
