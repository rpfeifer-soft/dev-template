FROM node:latest

WORKDIR /app

COPY ./package.json ./package-lock.json /app/
RUN npm install
COPY ./dist /app/

RUN npm install -g nodemon

CMD nodemon

EXPOSE 3001
