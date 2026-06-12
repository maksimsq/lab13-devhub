FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy remaining source code files
COPY . .

# Expose port
EXPOSE 3000

# Run Node server
CMD ["node", "server.js"]
