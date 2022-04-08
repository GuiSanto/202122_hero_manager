FROM node
WORKDIR /app/services/marvel
COPY package.json .
RUN npm install
RUN npm install -g nodemon
ENTRYPOINT [ "nodemon", "src/" ]