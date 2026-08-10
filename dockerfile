FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install -g npm@11.6.0
RUN npm ci --include=optional

COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install -g npm@11.6.0
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder --chown=node:node /app/.output ./.output
COPY --from=builder --chown=node:node /app/drizzle ./drizzle
COPY --from=builder --chown=node:node /app/scripts/migrate-production.mjs ./scripts/migrate-production.mjs
COPY --from=builder --chown=node:node /app/scripts/start-production.sh ./scripts/start-production.sh

USER node
EXPOSE 3000
CMD ["sh", "./scripts/start-production.sh"]
