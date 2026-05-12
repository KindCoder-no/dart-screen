# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install sudo for system commands (optional - may not work in all container setups)
RUN apk add --no-cache sudo

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --production && \
    npm cache clean --force

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy backend files
COPY backend ./backend

# Create a non-root user for running the app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Allow nodejs user to run sudo commands without password (adjust as needed)
# Note: This is a security consideration and may need adjustment based on deployment
RUN echo "nodejs ALL=(root) NOPASSWD: /usr/bin/systemctl" >> /etc/sudoers.d/nodejs && \
    chmod 0440 /etc/sudoers.d/nodejs

USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start production server
ENV NODE_ENV=production
CMD ["npm", "start"]
