# Development Stage: Build the project
FROM node:18 AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files and build the project
COPY tsconfig.json ./
COPY src src
RUN npm run build

# Production Stage: Only copy what's needed
FROM node:18
WORKDIR /app

# Install required tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Download wait-for-it script
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /app/wait-for-it.sh
RUN chmod +x /app/wait-for-it.sh

# Copy built application and necessary files
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --only=production
COPY --from=build /app/dist /app/dist
COPY .env .env

EXPOSE ${PORT:-3000}

CMD ["/bin/sh", "-c", "/app/wait-for-it.sh database:3306 -- npm run migration:generate && node dist/app.js"]
