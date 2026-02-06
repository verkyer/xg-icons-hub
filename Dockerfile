FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies without running lifecycle scripts
COPY package*.json ./
RUN npm install --progress=false --ignore-scripts

# Copy required sources (exclude images)
COPY build.js ./build.js
COPY server/ ./server/
COPY static/ ./static/
COPY views/ ./views/

# Build static assets explicitly
RUN node build.js

EXPOSE 5000
CMD ["node", "server/index.js"]
