FROM node
RUN mkdir -p /app
COPY . /app/
WORKDIR /app
RUN npm i --production --registry=https://registry.npm.taobao.org
CMD ["node", "dist/app.js"]