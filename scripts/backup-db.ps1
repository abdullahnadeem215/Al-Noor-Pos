# PowerShell script to backup PostgreSQL database al_noor_grocery
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = Join-Path $PSScriptRoot "..\storage\app\backups"

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$backupFile = Join-Path $backupDir "al_noor_grocery_backup_$timestamp.sql"

Write-Host "Creating database backup at: $backupFile"
pg_dump -h 127.0.0.1 -p 5433 -U postgres al_noor_grocery > $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup completed successfully: $backupFile"
} else {
    Write-Host "pg_dump failed or pg_dump executable not in PATH. Generating Laravel JSON export backup..."
    php artisan db:backup-json
}
