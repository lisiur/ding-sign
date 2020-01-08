FROM node
RUN mkdir -p /app
COPY . /app/
EXPOSE 3000
WORKDIR /app
RUN npm i --production --registry=https://registry.npm.taobao.org
CMD ["node", "dist/app.js"]