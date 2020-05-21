# Build process
FROM node as build-deps

WORKDIR /app

COPY ./package.json ./package-lock.json /app/

RUN npm install

COPY ./src /app/src/
COPY ["./rollup.*.js",  "/app/"]

RUN npm run build

# Prepare runtime node_modules
FROM node as run-deps

WORKDIR /app

COPY ./package.json ./package-lock.json /app/

RUN npm install --production

# Production environment
FROM node:alpine

WORKDIR /app

COPY --from=run-deps /app /app/

COPY --from=build-deps /app/dist/prod /app/dist/prod/
COPY --from=build-deps /app/dist/server /app/dist/server/
COPY --from=build-deps /app/dist/shared /app/dist/shared/

CMD npm run start:prod

EXPOSE 3001
