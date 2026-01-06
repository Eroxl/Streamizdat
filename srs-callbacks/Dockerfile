FROM node:20-alpine
COPY package.json tsconfig.json ./
RUN npm install

EXPOSE 8080
COPY src ./src
RUN npm run build
CMD ["npm", "start"]
