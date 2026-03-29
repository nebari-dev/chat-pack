FROM node:22-alpine

WORKDIR /app

# Install dependencies first to leverage layer caching.
COPY package*.json ./
RUN npm ci

# Copy the rest of the frontend source.
COPY ./ ./

# Set a default value for API_URL, used by Vite's dev server proxy.
ENV API_URL=http://host.docker.internal:8000

EXPOSE 8080

# Run the Vite dev server, binding to all interfaces so it's reachable from the host.
CMD ["npm", "run", "dev", "--", "--host"]