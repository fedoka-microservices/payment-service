FROM node:22.17-alpine3.21

WORKDIR /usr/src/app
COPY package*.json ./

RUN yarn install

COPY . .
EXPOSE 3004