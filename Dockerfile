FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install --progress=false

# Copy necessary sources excluding images
COPY build.js ./build.js
COPY server/ ./server/
COPY static/ ./static/
COPY views/ ./views/

RUN node build.js

EXPOSE 5000
CMD ["node", "server/index.js"]
