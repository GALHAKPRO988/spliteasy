# --- build ---
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock* bunfig.toml* ./
RUN bun install --frozen-lockfile || bun install
COPY . .
# Build a plain Node server instead of the default edge target
ENV NITRO_PRESET=node-server
RUN bun run build

# --- run ---
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATA_DIR=/data
COPY --from=build /app/.output ./.output
RUN mkdir -p /data && chown -R node:node /data /app
USER node
VOLUME ["/data"]
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
