FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies without running lifecycle scripts
COPY package*.json ./
RUN npm install --progress=false --ignore-scripts

# Copy required sources
COPY build.js ./build.js
COPY server/ ./server/
COPY static/ ./static/
COPY views/ ./views/

# Build static assets explicitly
RUN node build.js

# Keep bundled icons outside /app/images so bind mounts cannot hide them
COPY images/ /app/default-images/
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 5000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server/index.js"]
