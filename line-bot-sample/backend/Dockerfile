FROM node:latest
WORKDIR /workspace/line-bot-sample/backend
COPY package.json package-lock.json ./
RUN npm install
RUN apt-get update && apt-get install -y postgresql-client netcat-openbsd
CMD ["node", "server.js"]