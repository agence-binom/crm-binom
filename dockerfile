FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --include=optional

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
