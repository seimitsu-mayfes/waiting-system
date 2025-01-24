FROM node:18
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN apt-get update && apt-get install -y postgresql-client netcat-openbsd
CMD ["node", "server.js"]