# ==========================================
# Etapa de desenvolupament (Dev)
# ==========================================
FROM php:8.3-fpm-alpine AS development
WORKDIR /var/www/html
RUN apk add --no-cache postgresql-dev zip unzip \
    && docker-php-ext-install pdo pdo_pgsql
# Instal·lem Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
CMD ["php-fpm"]

# ==========================================
# Etapa de producció (Prod)
# ==========================================
FROM php:8.3-fpm-alpine AS production
WORKDIR /var/www/html
RUN apk add --no-cache postgresql-dev zip unzip libpng-dev libzip-dev \
    && docker-php-ext-install pdo pdo_pgsql opcache

# Instal·lem Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY . .

# Instal·lem dependències de producció
RUN composer install --no-dev --optimize-autoloader

# Permisos per a Laravel (CRÍTIC per logs i sessions)
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

CMD ["php-fpm"]