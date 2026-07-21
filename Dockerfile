FROM node:20-bookworm-slim

# 安装pnpm
RUN npm install -g pnpm

# 安装chromium和字体
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 必须同时复制两个文件
COPY package.json pnpm-lock.yaml ./
# --shamefully-hoist 核心！把二进制提升到node_modules，让系统能找到remotion
RUN pnpm install --shamefully-hoist

COPY . .

ENV BROWSER_EXECUTABLE=/usr/bin/chromium
ENV PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu"

EXPOSE 3001
CMD ["node", "server.js"]