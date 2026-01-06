FROM node:20-alpine

WORKDIR /embed-watcher/

COPY package.json tsconfig.json ./
RUN npm install

EXPOSE 8080
COPY src ./src

RUN npm run build

CMD ["npm", "start"]
