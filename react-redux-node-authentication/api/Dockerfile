FROM node:5.9.1

WORKDIR /usr/src/app
EXPOSE 3000

COPY package.json /usr/src/app
RUN npm install

COPY . /usr/src/app/

CMD npm start

