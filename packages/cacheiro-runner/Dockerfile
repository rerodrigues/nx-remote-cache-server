FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/cacheiro-types/package.json ./packages/cacheiro-types/
COPY packages/cacheiro-store-fs/package.json ./packages/cacheiro-store-fs/
COPY packages/cacheiro-store-s3/package.json ./packages/cacheiro-store-s3/
COPY packages/cacheiro-store-gcs/package.json ./packages/cacheiro-store-gcs/
COPY packages/cacheiro-store-azure/package.json ./packages/cacheiro-store-azure/
COPY packages/cacheiro/package.json ./packages/cacheiro/
COPY packages/cacheiro-runner/package.json ./packages/cacheiro-runner/
RUN npm ci

COPY packages/ ./packages/
RUN npm run build -w packages/cacheiro-types
RUN npm run build -w packages/cacheiro-store-fs
RUN npm run build -w packages/cacheiro-store-s3
RUN npm run build -w packages/cacheiro-store-gcs
RUN npm run build -w packages/cacheiro-store-azure
RUN npm run build -w packages/cacheiro
RUN npm run build -w packages/cacheiro-runner


FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV CACHEIRO_CACHE_DIRECTORY=/cache

COPY package.json package-lock.json ./
COPY packages/cacheiro-types/package.json ./packages/cacheiro-types/
COPY packages/cacheiro-store-fs/package.json ./packages/cacheiro-store-fs/
COPY packages/cacheiro-store-s3/package.json ./packages/cacheiro-store-s3/
COPY packages/cacheiro-store-gcs/package.json ./packages/cacheiro-store-gcs/
COPY packages/cacheiro-store-azure/package.json ./packages/cacheiro-store-azure/
COPY packages/cacheiro/package.json ./packages/cacheiro/
COPY packages/cacheiro-runner/package.json ./packages/cacheiro-runner/
RUN npm ci --omit=dev

COPY --from=builder /app/packages/cacheiro-types/dist ./packages/cacheiro-types/dist
COPY --from=builder /app/packages/cacheiro-store-fs/dist ./packages/cacheiro-store-fs/dist
COPY --from=builder /app/packages/cacheiro-store-s3/dist ./packages/cacheiro-store-s3/dist
COPY --from=builder /app/packages/cacheiro-store-gcs/dist ./packages/cacheiro-store-gcs/dist
COPY --from=builder /app/packages/cacheiro-store-azure/dist ./packages/cacheiro-store-azure/dist
COPY --from=builder /app/packages/cacheiro/dist ./packages/cacheiro/dist
COPY packages/cacheiro/configSchema.json ./packages/cacheiro/configSchema.json
COPY packages/cacheiro/swagger.json ./packages/cacheiro/swagger.json
COPY --from=builder /app/packages/cacheiro-runner/dist ./packages/cacheiro-runner/dist
COPY packages/cacheiro-runner/config ./packages/cacheiro-runner/config
COPY packages/cacheiro-runner/ecosystem.config.cjs ./packages/cacheiro-runner/ecosystem.config.cjs

WORKDIR /app/packages/cacheiro-runner

VOLUME /cache

EXPOSE 3000

CMD ["npm", "start"]
