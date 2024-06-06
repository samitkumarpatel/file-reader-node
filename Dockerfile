FROM node:20-alpine
RUN mkdir /usr/application
WORKDIR /usr/application
ADD package.json index.js /usr/application/
RUN npm install
ENTRYPOINT [ "node","index.js" ]