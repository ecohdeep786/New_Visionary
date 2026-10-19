FROM node:24-bookworm-slim AS web
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY frontend/ ./
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_AUTH_MODE=firebase
RUN npm run build

FROM node:24-bookworm-slim AS api
WORKDIR /build/backend
COPY backend/upstream/backend/package.json backend/upstream/backend/package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY backend/upstream/backend/tsconfig*.json backend/upstream/backend/nest-cli.json ./
COPY backend/upstream/backend/src/ ./src/
COPY backend/upstream/backend/prisma/schema.prisma ./prisma/schema.prisma
# Generate compile-time legacy types only; the product entrypoint never starts
# Prisma or runs a database migration/seed. All lifecycle scripts stay disabled.
RUN ./node_modules/.bin/prisma generate --schema ./prisma/schema.prisma && npm run build && npm prune --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:24-bookworm-slim AS product
ENV NODE_ENV=production PORT=8080 PUBLIC_ROOT=/app/public
WORKDIR /app/backend
COPY --from=api --chown=node:node /build/backend/node_modules ./node_modules
COPY --from=api --chown=node:node /build/backend/dist ./dist
COPY --from=web --chown=node:node /build/frontend/dist /app/public
USER node
EXPOSE 8080
CMD ["node", "dist/src/main-product.js"]
