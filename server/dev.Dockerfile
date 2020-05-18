FROM node:latest

WORKDIR /server

COPY ./package.json ./package-lock.json /server/
RUN npm install
COPY ./build /server/

RUN npm install -g nodemon

CMD nodemon

EXPOSE 3001
