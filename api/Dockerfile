# ==========================================
# Etapa de desenvolupament (Dev)
# ==========================================
FROM php:8.2-fpm-alpine AS development
WORKDIR /var/www/html
RUN apk add --no-cache postgresql-dev zip unzip \
    && docker-php-ext-install pdo pdo_pgsql
# Instal·lem Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
CMD ["php-fpm"]

# ==========================================
# Etapa de producció (Prod)
# ==========================================
FROM php:8.2-fpm-alpine AS production
WORKDIR /var/www/html
RUN apk add --no-cache postgresql-dev zip unzip \
    && docker-php-ext-install pdo pdo_pgsql opcache
COPY . .
CMD ["php-fpm"]