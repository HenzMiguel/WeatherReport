FROM node:22.19.0-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY backend ./backend
COPY frontend ./frontend
COPY SDD ./SDD

EXPOSE 3000 5173
