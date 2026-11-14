FROM node:24-bookworm-slim AS build

WORKDIR /app

# Cached system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Cached Node dependencies
COPY package.json ./
RUN npm i --omit=dev

# Application source
COPY . .


FROM node:24-bookworm-slim

WORKDIR /app

# Cached FFmpeg installation
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app /app

CMD ["node", "main.js"]