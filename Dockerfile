# Use Node.js LTS as the base image
FROM node:20-alpine

# Install system dependencies needed for canvas and other native packages
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies including dev dependencies needed for build
RUN npm ci --production=false

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Set environment variables for production
ENV NODE_ENV=production

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 