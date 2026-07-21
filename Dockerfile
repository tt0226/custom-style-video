FROM node:20-bookworm-slim

# 先全局安装pnpm
RUN npm install -g pnpm

# 安装Chromium与字体
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 重点：同时复制 package.json + pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./
# --shamefully-hoist 解决pnpm软链接导致.bin命令找不到（对应你本地ENOENT问题）
RUN pnpm install --shamefully-hoist

COPY . .

ENV BROWSER_EXECUTABLE=/usr/bin/chromium
ENV PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu"

EXPOSE 3001
CMD ["node", "server.js"]