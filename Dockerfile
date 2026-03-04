FROM node:20-bookworm-slim

# Chromium + CJK fonts for Remotion rendering
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .

ENV BROWSER_EXECUTABLE=/usr/bin/chromium
EXPOSE 3001

CMD ["node", "server.js"]
