#!/bin/sh
set -e

# Run Laravel database migrations automatically
php /var/www/html/artisan migrate --force

# Seed database with initial products & demo users if table empty
php /var/www/html/artisan db:seed --force || true

# Cache routes & config
php /var/www/html/artisan config:cache
php /var/www/html/artisan route:cache

# Start supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
