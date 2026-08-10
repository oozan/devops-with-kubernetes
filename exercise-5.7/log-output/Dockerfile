FROM node:22-alpine

WORKDIR /usr/src/app

COPY writer.js .
COPY server.js .

USER node
CMD ["node", "server.js"]
