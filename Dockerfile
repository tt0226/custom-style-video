FROM node:20-bookworm-slim

RUN npm install -g pnpm

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --shamefully-hoist

COPY . .

# 新增：把项目node_modules/.bin注入环境PATH
ENV PATH="/app/node_modules/.bin:${PATH}"
ENV BROWSER_EXECUTABLE=/usr/bin/chromium
ENV PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu"

EXPOSE 3001
CMD ["node", "server.js"]