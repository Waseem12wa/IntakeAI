FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./
RUN npm install

# Copy backend source code
COPY backend/ ./

# Copy schemas folder to /schemas in container
COPY schemas /schemas

EXPOSE 5000

CMD ["npm", "start"]
