FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/cacheiro/package.json ./packages/cacheiro/
RUN npm ci --workspace=packages/cacheiro

COPY packages/cacheiro/ ./packages/cacheiro/
RUN npm run build -w packages/cacheiro


FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV CACHE_DIR=/cache

COPY package.json package-lock.json ./
COPY packages/cacheiro/package.json ./packages/cacheiro/
RUN npm ci --workspace=packages/cacheiro --omit=dev

COPY --from=builder /app/packages/cacheiro/dist ./packages/cacheiro/dist
COPY packages/cacheiro/config ./packages/cacheiro/config
COPY packages/cacheiro/swagger.json ./packages/cacheiro/swagger.json
COPY packages/cacheiro/ecosystem.config.cjs ./packages/cacheiro/ecosystem.config.cjs

WORKDIR /app/packages/cacheiro

VOLUME /cache

EXPOSE 3000

CMD ["npm", "start"]
