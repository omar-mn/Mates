FROM node:22.19-alpine AS base

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

RUN npm run build

FROM nginx:stable-alpine3.23

COPY nginx.conf /etc/nginx/
COPY --from=base /app/dist /var/mates/dist

CMD ["nginx", "-g", "daemon off;"]