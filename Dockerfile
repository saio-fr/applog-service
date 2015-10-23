FROM node:latest

ENV NPM_TOKEN //registry.npmjs.org/:_authToken=16b46f03-f1fb-4dce-9a98-c7e685751e67
RUN echo $NPM_TOKEN > ~/.npmrc

COPY . /opt/service
WORKDIR /opt/service

RUN npm install

EXPOSE 8080 8081

ENTRYPOINT ["npm", "start", "--"]
