FROM node:24-bookworm-slim@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5 AS web
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

FROM node:24-bookworm-slim@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5 AS api
WORKDIR /build/backend
COPY infrastructure/gcp/runtime/package.json infrastructure/gcp/runtime/package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY backend/upstream/backend/tsconfig*.json backend/upstream/backend/nest-cli.json ./
COPY backend/upstream/backend/src/ ./src/
# Compile the selected product import graph with a stable dist/src path. The
# unrelated legacy app/Prisma/ML startup graph is neither compiled nor started.
RUN ./node_modules/.bin/tsc -p tsconfig.product.json && npm prune --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:24-bookworm-slim@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5 AS product
ARG VISIONARY_RELEASE_COMMIT
LABEL org.opencontainers.image.revision=$VISIONARY_RELEASE_COMMIT
ENV VISIONARY_RELEASE_COMMIT=$VISIONARY_RELEASE_COMMIT
ENV NODE_ENV=production PORT=8080 PUBLIC_ROOT=/app/public
WORKDIR /app/backend
COPY --from=api --chown=node:node /build/backend/node_modules ./node_modules
COPY --from=api --chown=node:node /build/backend/dist ./dist
COPY --from=web --chown=node:node /build/frontend/dist /app/public
USER node
EXPOSE 8080
CMD ["node", "dist/src/main-product.js"]
