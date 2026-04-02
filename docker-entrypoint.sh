#!/bin/bash
set -e

# Generate config.php if it's empty (first boot or fresh deploy)
if [ ! -s /var/www/html/config.php ]; then
  echo "Generating OpenCart config.php..."

  DB_DRIVER="${OPENCART_DB_DRIVER:-mysqli}"
  DB_HOST="${OPENCART_DB_HOST:-localhost}"
  DB_USER="${OPENCART_DB_USER:-opencart}"
  DB_PASS="${OPENCART_DB_PASSWORD:-}"
  DB_NAME="${OPENCART_DB_NAME:-opencart}"
  DB_PORT="${OPENCART_DB_PORT:-3306}"
  DB_PREFIX="${OPENCART_DB_PREFIX:-oc_}"
  SITE_URL="${OPENCART_SITE_URL:-http://localhost/}"

  # Ensure SITE_URL ends with /
  [[ "$SITE_URL" != */ ]] && SITE_URL="${SITE_URL}/"

  # Catalog config.php
  cat > /var/www/html/config.php << EOFCONFIG
<?php
// APPLICATION
define('APPLICATION', 'Catalog');

// HTTP
define('HTTP_SERVER', '${SITE_URL}');

// DIR
define('DIR_OPENCART', '/var/www/html/');
define('DIR_APPLICATION', DIR_OPENCART . 'catalog/');
define('DIR_EXTENSION', DIR_OPENCART . 'extension/');
define('DIR_IMAGE', DIR_OPENCART . 'image/');
define('DIR_SYSTEM', DIR_OPENCART . 'system/');
define('DIR_STORAGE', DIR_SYSTEM . 'storage/');
define('DIR_LANGUAGE', DIR_APPLICATION . 'language/');
define('DIR_TEMPLATE', DIR_APPLICATION . 'view/template/');
define('DIR_CONFIG', DIR_SYSTEM . 'config/');
define('DIR_CACHE', DIR_STORAGE . 'cache/');
define('DIR_DOWNLOAD', DIR_STORAGE . 'download/');
define('DIR_LOGS', DIR_STORAGE . 'logs/');
define('DIR_SESSION', DIR_STORAGE . 'session/');
define('DIR_UPLOAD', DIR_STORAGE . 'upload/');

// DB
define('DB_DRIVER', '${DB_DRIVER}');
define('DB_HOSTNAME', '${DB_HOST}');
define('DB_USERNAME', '${DB_USER}');
define('DB_PASSWORD', '${DB_PASS}');
define('DB_DATABASE', '${DB_NAME}');
define('DB_PORT', '${DB_PORT}');
define('DB_PREFIX', '${DB_PREFIX}');
define('DB_SSL_KEY', '');
define('DB_SSL_CERT', '');
define('DB_SSL_CA', '');
EOFCONFIG

  # Admin config.php
  cat > /var/www/html/admin/config.php << EOFCONFIG
<?php
// APPLICATION
define('APPLICATION', 'Admin');

// HTTP
define('HTTP_SERVER', '${SITE_URL}admin/');
define('HTTP_CATALOG', '${SITE_URL}');

// DIR
define('DIR_OPENCART', '/var/www/html/');
define('DIR_APPLICATION', DIR_OPENCART . 'admin/');
define('DIR_EXTENSION', DIR_OPENCART . 'extension/');
define('DIR_IMAGE', DIR_OPENCART . 'image/');
define('DIR_SYSTEM', DIR_OPENCART . 'system/');
define('DIR_STORAGE', DIR_SYSTEM . 'storage/');
define('DIR_CATALOG', DIR_OPENCART . 'catalog/');
define('DIR_LANGUAGE', DIR_APPLICATION . 'language/');
define('DIR_TEMPLATE', DIR_APPLICATION . 'view/template/');
define('DIR_CONFIG', DIR_SYSTEM . 'config/');
define('DIR_CACHE', DIR_STORAGE . 'cache/');
define('DIR_DOWNLOAD', DIR_STORAGE . 'download/');
define('DIR_LOGS', DIR_STORAGE . 'logs/');
define('DIR_SESSION', DIR_STORAGE . 'session/');
define('DIR_UPLOAD', DIR_STORAGE . 'upload/');

// DB
define('DB_DRIVER', '${DB_DRIVER}');
define('DB_HOSTNAME', '${DB_HOST}');
define('DB_USERNAME', '${DB_USER}');
define('DB_PASSWORD', '${DB_PASS}');
define('DB_DATABASE', '${DB_NAME}');
define('DB_PORT', '${DB_PORT}');
define('DB_PREFIX', '${DB_PREFIX}');
define('DB_SSL_KEY', '');
define('DB_SSL_CERT', '');
define('DB_SSL_CA', '');
EOFCONFIG

  chown www-data:www-data /var/www/html/config.php /var/www/html/admin/config.php
  chmod 644 /var/www/html/config.php /var/www/html/admin/config.php

  echo "Config files generated."
fi

# Start Apache
exec apache2-foreground
