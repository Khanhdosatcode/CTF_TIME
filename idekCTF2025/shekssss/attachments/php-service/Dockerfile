FROM php:8.2-apache
RUN apt-get update && apt-get install -y libffi-dev
RUN docker-php-ext-install ffi
COPY php.ini /usr/local/etc/php/php.ini
COPY flag.txt /flag.txt
RUN mv /flag.txt /flag_$(head /dev/urandom | tr -dc a-z0-9 | head -c 16).txt
COPY index.php /var/www/html/
EXPOSE 80
