#!/bin/bash
set -e

# Start MySQL
service mysql start

# Wait for MySQL to be ready
while ! mysqladmin ping -h"localhost" --silent; do
    echo "Waiting for MySQL to be available..."
    sleep 1
done

# Fix MySQL socket permissions for web server access
chmod 755 /var/run/mysqld/

# Create WordPress database and user
mysql -e "CREATE DATABASE IF NOT EXISTS ${WORDPRESS_DB_NAME:-wordpress};"
mysql -e "CREATE USER IF NOT EXISTS '${WORDPRESS_DB_USER:-wordpress}'@'localhost' IDENTIFIED BY '${WORDPRESS_DB_PASSWORD:-wordpress}';"
mysql -e "GRANT ALL PRIVILEGES ON ${WORDPRESS_DB_NAME:-wordpress}.* TO '${WORDPRESS_DB_USER:-wordpress}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Configure WordPress
cd /var/www/html

# Ensure wp-content directories exist with proper permissions
mkdir -p wp-content/uploads wp-content/themes wp-content/plugins
chown -R www-data:www-data wp-content
chmod -R 755 wp-content

# Generate admin credentials
ADMIN_USER=$(tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 32)
ADMIN_PASSWORD=$(tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 32)

# Create wp-config.php
wp-cli --allow-root core config \
    --dbhost=localhost \
    --dbname=${WORDPRESS_DB_NAME:-wordpress} \
    --dbuser=${WORDPRESS_DB_USER:-wordpress} \
    --dbpass=${WORDPRESS_DB_PASSWORD:-wordpress} \
    --locale=${WORDPRESS_LOCALE:-en_US}

# Install WordPress
wp-cli --allow-root core install \
    --url="http://localhost" \
    --title="${WORDPRESS_WEBSITE_TITLE:-Challenge Site}" \
    --admin_user=$ADMIN_USER \
    --admin_password=$ADMIN_PASSWORD \
    --admin_email=${WORDPRESS_ADMIN_EMAIL:-admin@example.com}

# Configure WordPress settings
wp-cli --allow-root option update siteurl "http://localhost"
wp-cli --allow-root option update home "http://localhost"
wp-cli --allow-root rewrite structure "${WORDPRESS_WEBSITE_POST_URL_STRUCTURE:-/%postname%/}"

# Remove default plugins and activate fancy plugin
wp-cli --allow-root plugin delete akismet || true
wp-cli --allow-root plugin delete hello-dolly || true
wp-cli --allow-root plugin activate fancy

# Set permissions
chmod -R 555 /var/www/html/
chmod -R 755 /var/www/html/wp-content/uploads
chmod 644 /var/www/html/wp-config.php

echo "WordPress setup complete!"
echo "Admin User: $ADMIN_USER"
echo "Admin Password: $ADMIN_PASSWORD"

# Ensure Apache logs are properly configured for Docker
echo "Configuring Apache logging for Docker output..."

# Start Apache in foreground with explicit logging
exec apache2ctl -D FOREGROUND -e info 