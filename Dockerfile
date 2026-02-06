FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build static assets
RUN node build.js

# Run server
EXPOSE 5000
CMD ["node", "server/index.js"]
