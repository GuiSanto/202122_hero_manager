FROM node:alpine
WORKDIR /app/backend
RUN npm install -g nodemon
COPY package.json .
RUN npm install
ENTRYPOINT [ "nodemon", "src/" ]