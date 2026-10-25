FROM node:24-bookworm-slim@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5 AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY infrastructure/gcp/data-job/package.json infrastructure/gcp/data-job/package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY backend/upstream/backend/prisma/schema.prisma ./prisma/schema.prisma
COPY backend/upstream/backend/prisma/migrations/20261024000001_data_01_workspaces/ ./prisma/migrations/20261024000001_data_01_workspaces/
COPY backend/upstream/backend/src/data/ ./src/data/
COPY infrastructure/gcp/data-job/tsconfig.json ./tsconfig.json
RUN ./node_modules/.bin/prisma generate && ./node_modules/.bin/tsc -p tsconfig.json && npm prune --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:24-bookworm-slim@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ARG VISIONARY_RELEASE_COMMIT
ENV NODE_ENV=production VISIONARY_RELEASE_COMMIT=$VISIONARY_RELEASE_COMMIT
LABEL org.opencontainers.image.revision=$VISIONARY_RELEASE_COMMIT
WORKDIR /app/backend
COPY --from=build --chown=node:node /build/node_modules ./node_modules
COPY --from=build --chown=node:node /build/dist ./dist
COPY --from=build --chown=node:node /build/prisma/migrations/20261024000001_data_01_workspaces/ ./prisma/migrations/20261024000001_data_01_workspaces/
USER node
ENTRYPOINT ["node", "dist/src/data/migration-command.js"]
CMD ["plan"]
