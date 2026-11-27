# syntax=docker/dockerfile:1

FROM oven/bun:1.4.4 AS build
WORKDIR /app

COPY package.json bun.lock ./
COPY web/package.json web/
COPY packages/cli/package.json packages/cli/
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1.4.4 AS prod-deps
WORKDIR /app

COPY package.json bun.lock ./
COPY web/package.json web/
COPY packages/cli/package.json packages/cli/
RUN bun install --frozen-lockfile --production

FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/web/node_modules ./web/node_modules
COPY --from=build /app/web/dist ./web/dist
COPY --from=build /app/web/server.mjs ./web/server.mjs

WORKDIR /app/web

USER node
EXPOSE 3000

CMD ["node", "server.mjs"]
