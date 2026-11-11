FROM node:22-bookworm-slim AS build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/* \
  && npm ci
COPY frontend/ ./
RUN npm run generate-routes && npm run build
RUN npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime

WORKDIR /app/frontend
ENV NODE_ENV=production
ENV PORT=3000
ENV CARD_DB_PATH=/app/data/flashcards.db

COPY --from=build /app/frontend/package*.json ./
COPY --from=build /app/frontend/node_modules ./node_modules
COPY --from=build /app/frontend/dist ./dist
COPY --from=build /app/frontend/server-entry.mjs ./server-entry.mjs
COPY --from=build /app/frontend/telemetry-entry.mjs ./telemetry-entry.mjs

RUN mkdir -p /app/data
EXPOSE 3000
CMD ["npm", "run", "start"]
