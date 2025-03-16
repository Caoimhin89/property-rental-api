# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy SQL files and init script
COPY schema.sql seed.sql init-db.sh /docker-entrypoint-initdb.d/

# Make init script executable
RUN chmod +x /docker-entrypoint-initdb.d/init-db.sh

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"] 