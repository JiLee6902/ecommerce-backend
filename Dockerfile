
FROM node:18-alpine

RUN apk add --no-cache curl python3 make g++

WORKDIR /app

COPY package*.json ./

RUN npm cache clean --force && \
    npm install && \
    npm install bcryptjs

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
