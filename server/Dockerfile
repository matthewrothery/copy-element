# ----------- BUILD STAGE -----------
FROM node:24-alpine3.23 AS builder

WORKDIR /app

COPY server/package.json server/package-lock.json* ./
RUN npm ci

COPY server/. .
RUN npm run build

# ----------- RUNTIME STAGE -----------
FROM node:24-alpine3.23 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80

COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# SQLite data dir (bind-mount in compose)
ENV DATABASE_PATH=/data/element-armory.db

EXPOSE 80

CMD ["node", "dist/index.js"]
