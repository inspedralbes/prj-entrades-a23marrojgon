FROM node:20-alpine AS development
WORKDIR /app
# En dev no copiem fitxers perquè fem servir el volum de Docker
CMD ["sh", "-c", "npm install && npm run dev"]

FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]