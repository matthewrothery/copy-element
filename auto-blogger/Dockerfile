FROM node:24-alpine3.23 AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-alpine3.23 AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY copywriter-prompt.md guide.md list.md rules.md ./

VOLUME ["/data"]

CMD ["node", "dist/index.js"]
