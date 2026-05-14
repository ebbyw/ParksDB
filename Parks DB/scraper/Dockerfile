FROM node:22-alpine

WORKDIR /scraper

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy scraper script
COPY scraper.js .

# Make executable
RUN chmod +x scraper.js

# Default command
CMD ["npm", "run", "scrape"]
