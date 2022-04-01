FROM node:alpine
WORKDIR /app/frontend
RUN npm install -g http-server
ENTRYPOINT [ "http-server", "src/" ]