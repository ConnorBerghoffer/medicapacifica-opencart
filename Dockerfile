FROM php:8.1-apache

# Install PHP extensions required by OpenCart
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libzip-dev \
    libicu-dev \
    unzip \
    curl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd mysqli pdo_mysql zip intl opcache \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Enable Apache modules
RUN a2enmod rewrite headers

# PHP configuration
RUN { \
    echo 'memory_limit = 512M'; \
    echo 'upload_max_filesize = 64M'; \
    echo 'post_max_size = 64M'; \
    echo 'max_execution_time = 300'; \
    echo 'max_input_time = 300'; \
    echo 'date.timezone = Pacific/Fiji'; \
    echo 'opcache.enable = 1'; \
    echo 'opcache.memory_consumption = 128'; \
    echo 'opcache.max_accelerated_files = 10000'; \
} > /usr/local/etc/php/conf.d/opencart.ini

# Apache configuration - allow .htaccess overrides
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

# Download and install OpenCart 4.1.0.3
ENV OPENCART_VERSION=4.1.0.3
RUN curl -fSL "https://github.com/opencart/opencart/releases/download/${OPENCART_VERSION}/opencart-${OPENCART_VERSION}.zip" -o /tmp/opencart.zip \
    && unzip /tmp/opencart.zip -d /tmp/opencart \
    && rm -rf /var/www/html/* \
    && cp -a /tmp/opencart/upload/. /var/www/html/ \
    && rm -rf /tmp/opencart /tmp/opencart.zip

# Create required config files (empty for web installer)
RUN touch /var/www/html/config.php \
    && touch /var/www/html/admin/config.php

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod 777 /var/www/html/config.php \
    && chmod 777 /var/www/html/admin/config.php \
    && chmod -R 777 /var/www/html/system/storage/ \
    && chmod -R 777 /var/www/html/image/ \
    && chmod -R 777 /var/www/html/image/cache/ \
    && chmod -R 777 /var/www/html/image/catalog/

EXPOSE 80

CMD ["apache2-foreground"]
