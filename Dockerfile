FROM node:22-alpine AS base
WORKDIR /app

# Copy required sources first (exclude images)
COPY build.js ./build.js
COPY server/ ./server/
COPY static/ ./static/
COPY views/ ./views/

# Install dependencies (postinstall will run build.js)
COPY package*.json ./
RUN npm install --progress=false

EXPOSE 5000
CMD ["node", "server/index.js"]
