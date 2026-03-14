FROM node:20-slim

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm install --production

COPY . .

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "src/index.js"]
