FROM node:alpine
MAINTAINER zbcjackson <zbcjackson@gmail.com>

USER root

RUN npm config set registry https://registry.npm.taobao.org -g

WORKDIR /var/workspace
COPY . /var/workspace
RUN yarn install
RUN yarn global add nodemon

EXPOSE 3000
CMD ["nodemon",  "/var/workspace/app.js"]

