FROM node:20-alpine AS development
WORKDIR /app
RUN npm install -g nodemon
CMD ["sh", "-c", "npm install && nodemon index.js"]

FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
CMD ["node", "index.js"]