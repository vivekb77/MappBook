FROM node:18-slim

# Set environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_OPTIONS="--max-old-space-size=4096" \
    DISPLAY=:99

# Install required dependencies including Xvfb
RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    fonts-noto-color-emoji \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xauth \
    xvfb \
    dbus-x11 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy function code
COPY . .

# Create symlink to match the expected path
RUN mkdir -p /usr/bin && ln -sf /usr/bin/chromium /usr/bin/chromium-browser

# Create necessary directories
RUN mkdir -p /tmp/frames && chmod -R 777 /tmp/frames

# Create a wrapper script to start Xvfb and then run the application
RUN echo '#!/bin/bash\nXvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &\nsleep 1\nexec "$@"' > /entrypoint.sh \
    && chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]