FROM node:22-alpine

WORKDIR /app

# Install dependencies first for caching
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

# Grant execution permissions
RUN chmod +x ./docker/entrypoint.sh

# The entrypoint will handle starting the chain and deploying
ENTRYPOINT ["./docker/entrypoint.sh"]