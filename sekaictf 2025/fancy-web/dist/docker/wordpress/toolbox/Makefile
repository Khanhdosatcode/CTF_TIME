WP_CLI=wp-cli --allow-root

ADMIN_USER := $(shell tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 32)
ADMIN_PASSWORD := $(shell tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 32)


install: configure

configure:  
	@echo "⚙️ Configuring Wordpress database..."
	dockerize -wait tcp://wp_service_1_db:3306 -timeout 120s 2> /dev/null #2>&1
	@rm -f wp-config.php

	@echo "Sleeping for 10 seconds to let dust settle in..."
	@sleep 10
	@echo "Continuing..."

	$(WP_CLI) core config \
		--dbhost=${WORDPRESS_DB_HOST} \
		--dbname=${WORDPRESS_DB_NAME} \
		--dbuser=${WORDPRESS_DB_USER} \
		--dbpass=${WORDPRESS_DB_PASSWORD} \
		--locale=${WORDPRESS_LOCALE}
	$(WP_CLI) core install \
		--url="${CHALL_SERVER_IP}:${CHALL_SERVER_PORT}" \
		--title="$(WORDPRESS_WEBSITE_TITLE)" \
		--admin_user=$(ADMIN_USER) \
		--admin_password=$(ADMIN_PASSWORD) \
		--admin_email=${WORDPRESS_ADMIN_EMAIL}

	$(WP_CLI) option update siteurl "http://${CHALL_SERVER_IP}:${CHALL_SERVER_PORT}"
	$(WP_CLI) rewrite structure $(WORDPRESS_WEBSITE_POST_URL_STRUCTURE)
	$(WP_CLI) plugin delete akismet
	$(WP_CLI) plugin delete hello-dolly
	$(WP_CLI) plugin activate fancy
	
	@chmod -R 555 /var/www/html/
	@chmod -R 755 /var/www/html/wp-content/uploads
	@curl "http://${CHALL_SERVER_IP}:${CHALL_SERVER_PORT}" > /dev/null
	@sleep 1
	@chmod 111 /var/www/html/wp-config.php