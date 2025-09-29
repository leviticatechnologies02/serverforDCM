# Use Node 18 base image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all project files
COPY . .

# Expose port Node will run on
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
