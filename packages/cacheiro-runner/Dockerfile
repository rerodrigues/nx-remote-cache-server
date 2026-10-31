FROM node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/cacheiro-types/package.json ./packages/cacheiro-types/
COPY packages/cacheiro-store-fs/package.json ./packages/cacheiro-store-fs/
COPY packages/cacheiro/package.json ./packages/cacheiro/
COPY packages/cacheiro-runner/package.json ./packages/cacheiro-runner/
RUN npm ci

COPY packages/ ./packages/
RUN npm run build -w packages/cacheiro-types
RUN npm run build -w packages/cacheiro-store-fs
RUN npm run build -w packages/cacheiro
RUN npm run build -w packages/cacheiro-runner


FROM node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914
WORKDIR /app

ENV NODE_ENV=production
ENV CACHEIRO_HOST=0.0.0.0
ENV CACHEIRO_CACHE_DIRECTORY=/cache

COPY package.json package-lock.json ./
COPY packages/cacheiro-types/package.json ./packages/cacheiro-types/
COPY packages/cacheiro-store-fs/package.json ./packages/cacheiro-store-fs/
COPY packages/cacheiro/package.json ./packages/cacheiro/
COPY packages/cacheiro-runner/package.json ./packages/cacheiro-runner/
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/packages/cacheiro-types/dist ./packages/cacheiro-types/dist
COPY --from=builder /app/packages/cacheiro-store-fs/dist ./packages/cacheiro-store-fs/dist
COPY --from=builder /app/packages/cacheiro/dist ./packages/cacheiro/dist
COPY packages/cacheiro/configSchema.json ./packages/cacheiro/configSchema.json
COPY packages/cacheiro-store-fs/configSchema.json ./packages/cacheiro-store-fs/configSchema.json
COPY packages/cacheiro/swagger.json ./packages/cacheiro/swagger.json
COPY --from=builder /app/packages/cacheiro-runner/dist ./packages/cacheiro-runner/dist
COPY packages/cacheiro-runner/config ./packages/cacheiro-runner/config
COPY packages/cacheiro-runner/ecosystem.config.cjs ./packages/cacheiro-runner/ecosystem.config.cjs

WORKDIR /app/packages/cacheiro-runner

RUN mkdir -p /cache && chown node:node /cache

VOLUME /cache

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "const e=process.env;require(e.CACHEIRO_TLS_CERT_FILE?'https':'http').get({host:'127.0.0.1',port:e.CACHEIRO_PORT||3000,path:'/health',rejectUnauthorized:false},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"]

CMD ["npm", "start"]
