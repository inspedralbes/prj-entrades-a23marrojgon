FROM node:20-alpine AS development
WORKDIR /app
# En dev no copiem fitxers perquè fem servir el volum de Docker
CMD ["sh", "-c", "npm install && npm run dev"]

FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .

# Inyectar variables de entorno en tiempo de construcción
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

RUN npm run build
CMD ["npm", "start"]