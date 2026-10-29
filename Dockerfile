FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

USER root
RUN apk add --no-cache wget ca-certificates
USER 101

WORKDIR /usr/share/nginx/html

COPY --from=build /app/dist/frontend/browser/ ./
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --start-period=10s --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- --spider http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
