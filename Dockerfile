# Multi-stage Dockerfile using Apache HTTPD Web Server
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit

COPY . .
RUN npm run build

# Apache HTTPD Server Stage
FROM httpd:2.4-alpine AS runner

# Enable mod_rewrite in Apache httpd.conf for SPA client routing
RUN sed -i '/LoadModule rewrite_module/s/^#//' /usr/local/apache2/conf/httpd.conf && \
    sed -i 's/AllowOverride None/AllowOverride All/g' /usr/local/apache2/conf/httpd.conf

# Copy static React build artifacts to Apache web root
COPY --from=builder /app/dist /usr/local/apache2/htdocs/
COPY .htaccess /usr/local/apache2/htdocs/.htaccess

EXPOSE 80

CMD ["httpd-foreground"]
