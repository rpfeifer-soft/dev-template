FROM node:latest

WORKDIR /app

COPY ./package.json ./package-lock.json /app/
RUN npm install
COPY ./build /app/

RUN npm install -g nodemon

CMD nodemon

EXPOSE 3001
