FROM php:8.2-fpm-alpine

# No extra extensions unless needed for your challenge
WORKDIR /var/www/html

# COPY Dirty.php .
COPY --chmod=111 ./readflag /
COPY --chmod=400 ./flag.txt /

RUN chown root:root /flag.txt /readflag
RUN chmod u+s /readflag

# Drop permissions to non-root for safety
RUN adduser -D ctf && chown -R ctf:ctf /var/www/html
USER ctf
