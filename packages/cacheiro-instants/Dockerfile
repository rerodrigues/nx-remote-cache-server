ARG STORE_TYPE=fs

# Full build: cacheiro-instants type-checks imports of all 4 store packages, so every
# store must be installed and built here, whatever the flavor. Production dependencies are
# then reinstalled for the selected flavor only, so the final image carries just that
# store's cloud SDK.
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/cacheiro-types/package.json ./packages/cacheiro-types/
COPY packages/cacheiro-store-fs/package.json ./packages/cacheiro-store-fs/
COPY packages/cacheiro-store-s3/package.json ./packages/cacheiro-store-s3/
COPY packages/cacheiro-store-gcs/package.json ./packages/cacheiro-store-gcs/
COPY packages/cacheiro-store-azure/package.json ./packages/cacheiro-store-azure/
COPY packages/cacheiro/package.json ./packages/cacheiro/
COPY packages/cacheiro-instants/package.json ./packages/cacheiro-instants/
RUN npm ci

COPY packages/cacheiro-types/ ./packages/cacheiro-types/
COPY packages/cacheiro-store-fs/ ./packages/cacheiro-store-fs/
COPY packages/cacheiro-store-s3/ ./packages/cacheiro-store-s3/
COPY packages/cacheiro-store-gcs/ ./packages/cacheiro-store-gcs/
COPY packages/cacheiro-store-azure/ ./packages/cacheiro-store-azure/
COPY packages/cacheiro/ ./packages/cacheiro/
COPY packages/cacheiro-instants/ ./packages/cacheiro-instants/
RUN npm run build -w packages/cacheiro-types
RUN npm run build -w packages/cacheiro-store-fs
RUN npm run build -w packages/cacheiro-store-s3
RUN npm run build -w packages/cacheiro-store-gcs
RUN npm run build -w packages/cacheiro-store-azure
RUN npm run build -w packages/cacheiro
RUN npm run build -w packages/cacheiro-instants


ARG STORE_TYPE
# Reinstall production deps for the selected flavor only. npm ci installs every workspace in
# the lockfile (even with -w), so narrow the root workspaces list first; the stores are
# optional peers of instants, so only the chosen store's cloud SDK ends up in node_modules.
# Runs natively on $BUILDPLATFORM (no QEMU); --ignore-scripts skips the root husky "prepare".
RUN node -e "const fs = require('fs'); const p = require('./package.json'); \
    p.workspaces = ['cacheiro-types', 'cacheiro', 'cacheiro-instants', 'cacheiro-store-${STORE_TYPE}'].map((n) => 'packages/' + n); \
    fs.writeFileSync('package.json', JSON.stringify(p, null, 2));" \
    && rm -rf node_modules \
    && npm ci --omit=dev --ignore-scripts


FROM node:22-alpine
ARG STORE_TYPE
WORKDIR /app

ENV NODE_ENV=production
ENV CACHEIRO_PORT=3000
ENV CACHEIRO_HOST=0.0.0.0
ENV CACHEIRO_STORE_TYPE=${STORE_TYPE}
ENV CACHEIRO_CACHE_DIRECTORY=/cache

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json /app/package-lock.json ./

COPY --from=builder /app/packages/cacheiro-types/package.json ./packages/cacheiro-types/package.json
COPY --from=builder /app/packages/cacheiro-types/dist ./packages/cacheiro-types/dist

COPY --from=builder /app/packages/cacheiro-store-${STORE_TYPE}/package.json ./packages/cacheiro-store-${STORE_TYPE}/package.json
COPY --from=builder /app/packages/cacheiro-store-${STORE_TYPE}/dist ./packages/cacheiro-store-${STORE_TYPE}/dist
COPY --from=builder /app/packages/cacheiro-store-${STORE_TYPE}/configSchema.json ./packages/cacheiro-store-${STORE_TYPE}/configSchema.json

COPY --from=builder /app/packages/cacheiro/package.json ./packages/cacheiro/package.json
COPY --from=builder /app/packages/cacheiro/dist ./packages/cacheiro/dist
COPY --from=builder /app/packages/cacheiro/configSchema.json ./packages/cacheiro/configSchema.json
COPY --from=builder /app/packages/cacheiro/swagger.json ./packages/cacheiro/swagger.json

COPY --from=builder /app/packages/cacheiro-instants/package.json ./packages/cacheiro-instants/package.json
COPY --from=builder /app/packages/cacheiro-instants/dist ./packages/cacheiro-instants/dist

WORKDIR /app/packages/cacheiro-instants

EXPOSE $CACHEIRO_PORT
# only used by the fs flavor — harmless no-op mount point on s3/gcs/azure images
VOLUME $CACHEIRO_CACHE_DIRECTORY

CMD ["node", "dist/index.js"]
