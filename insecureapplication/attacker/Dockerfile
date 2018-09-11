FROM node:8
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .
EXPOSE 1337

CMD ["npm","start"]
