FROM ubuntu:20.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    apache2 \
    php \
    php-mysql \
    php-cli \
    php-curl \
    php-gd \
    php-intl \
    php-mbstring \
    php-soap \
    php-xml \
    php-xmlrpc \
    php-zip \
    mysql-server \
    curl \
    wget \
    make \
    openssl \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Configure Apache
RUN a2enmod rewrite
RUN echo 'ServerName localhost' >> /etc/apache2/apache2.conf

# Configure Apache for WordPress
RUN echo '<Directory /var/www/html/>' >> /etc/apache2/apache2.conf \
    && echo '    AllowOverride All' >> /etc/apache2/apache2.conf \
    && echo '    Require all granted' >> /etc/apache2/apache2.conf \
    && echo '</Directory>' >> /etc/apache2/apache2.conf

# Configure Apache logging to stdout/stderr for Docker
RUN echo 'ErrorLog /dev/stderr' >> /etc/apache2/apache2.conf \
    && echo 'CustomLog /dev/stdout combined' >> /etc/apache2/apache2.conf \
    && echo 'LogLevel warn' >> /etc/apache2/apache2.conf

# Disable default log files to prevent disk usage
RUN rm -f /var/log/apache2/*.log \
    && ln -sf /dev/stdout /var/log/apache2/access.log \
    && ln -sf /dev/stderr /var/log/apache2/error.log

# Download and setup WordPress
WORKDIR /var/www/html
RUN rm -rf /var/www/html/* \
    && curl -O https://wordpress.org/latest.tar.gz \
    && tar -xzf latest.tar.gz --strip-components=1 \
    && rm latest.tar.gz \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Install WP-CLI
RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp-cli

# Install dockerize
ENV DOCKERIZE_VERSION v0.6.1
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz

# Copy custom plugin
COPY --chown=www-data:www-data challenge-custom/fancy/ /var/www/html/wp-content/plugins/fancy/

# Copy toolbox Makefile
COPY docker/wordpress/toolbox/Makefile /scripts/Makefile

# Copy initialization script
COPY init.sh /init.sh
RUN chmod +x /init.sh

# Environment variables with defaults
ENV WORDPRESS_DB_HOST="localhost"
ENV WORDPRESS_DB_NAME="wordpress"
ENV WORDPRESS_DB_USER="wordpress"
ENV WORDPRESS_DB_PASSWORD="wordpress"
ENV WORDPRESS_LOCALE="en_US"
ENV WORDPRESS_WEBSITE_TITLE="Challenge Site"
ENV WORDPRESS_ADMIN_EMAIL="admin@example.com"
ENV WORDPRESS_WEBSITE_POST_URL_STRUCTURE="/%postname%/"

EXPOSE 80

CMD ["/init.sh"] 