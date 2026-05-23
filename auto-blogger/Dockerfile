FROM node:24-slim AS builder

WORKDIR /app

# Build context is the repo root (not ./auto-blogger).
# See .github/workflows/deploy-apps.yml: context: . file: ./auto-blogger/Dockerfile
COPY auto-blogger/package.json auto-blogger/package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY auto-blogger/ ./auto-blogger/
COPY auto-blogger.config.mts ./auto-blogger.config.mts
RUN npm run build

FROM node:24-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY auto-blogger/package.json auto-blogger/package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY auto-blogger/copywriter-prompt.md auto-blogger/guide.md auto-blogger/list.md auto-blogger/rules.md ./

CMD ["node", "dist/auto-blogger/src/index.js"]
