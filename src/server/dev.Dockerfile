FROM node:latest

WORKDIR /app

COPY ./package.json ./package-lock.json /app/
RUN npm install
COPY ./dist /app/

RUN npm install -g nodemon

CMD npm run start:server

EXPOSE 3001
