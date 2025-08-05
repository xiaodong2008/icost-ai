# Use the official Node.js image as the base image
FROM node:lts

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install application dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port your application listens on
EXPOSE 7524

# Command to run the application when the container starts
CMD [ "npm", "start" ]

# Heartbeat
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:7524/health || exit 1