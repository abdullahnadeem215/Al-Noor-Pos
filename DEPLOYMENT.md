# Al-Noor Mart POS Backend - Deployment & Operations Guide

This guide details deployment instructions for production environments (Linux / Cloud VPS / Oracle Cloud / Render / Railway).

## 1. Prerequisites
- **PHP 8.3+** with extensions: `pdo_pgsql`, `pgsql`, `curl`, `mbstring`, `zip`, `intl`, `bcmath`.
- **PostgreSQL 15+** (Production DB).
- **Composer 2.x**.

## 2. Server Setup & Deployment Steps

### Step 1: Clone Repository & Install Dependencies
```bash
cd /var/www/al-noor-backend
composer install --no-dev --optimize-autoloader
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` and fill in production parameters:
```bash
cp .env.example .env
php artisan key:generate
```

Sample Production `.env`:
```ini
APP_NAME="Al-Noor Mart POS"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.alnoormart.com

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=al_noor_grocery_prod
DB_USERNAME=alnoor_user
DB_PASSWORD=YourStrongSecurePasswordHere

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
```

### Step 3: Run Database Migrations & Seeders
```bash
php artisan migrate --force
php artisan db:seed --force
```

### Step 4: Optimization & Caching
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 3. Database Backup & Restore Guide

### Manual PostgreSQL Database Backup
Run `pg_dump` to create an encrypted/timestamped SQL backup:
```bash
pg_dump -U postgres -h 127.0.0.1 -p 5433 -F c -b -v -f "/backups/al_noor_$(date +%Y%m%d_%H%M%s).dump" al_noor_grocery
```

### Database Restore
Restore from backup dump:
```bash
pg_restore -U postgres -h 127.0.0.1 -p 5433 -d al_noor_grocery --clean --verbose "/backups/al_noor_20261004.dump"
```

### Automated Daily Cron Backup
Add to crontab (`crontab -e`):
```cron
0 2 * * * pg_dump -U postgres -h 127.0.0.1 -p 5433 -F c -b al_noor_grocery > /backups/alnoor_daily_$(date +\%Y\%m\%d).dump
```
