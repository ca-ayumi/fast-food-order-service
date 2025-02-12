FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install && npm install -g @nestjs/cli

COPY . .

RUN npm run build

CMD [ "node", "dist/main" ]

EXPOSE 3000
