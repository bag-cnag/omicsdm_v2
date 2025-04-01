FROM node:23 AS builder

COPY ./ /app

WORKDIR /app

RUN npm install && npm run build

FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5001

CMD ["nginx", "-g", "daemon off;"]
