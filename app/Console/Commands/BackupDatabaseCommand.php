<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class BackupDatabaseCommand extends Command
{
    protected $signature = 'db:backup-json';
    protected $description = 'Export core database tables to JSON for safe data backup';

    public function handle()
    {
        $backupDir = storage_path('app/backups');
        if (!is_dir($backupDir)) {
            @mkdir($backupDir, 0755, true);
        }

        $tables = [
            'users',
            'categories',
            'products',
            'customers',
            'sales',
            'sale_items',
            'sale_payments',
            'credit_ledgers',
            'inventory_movements',
            'settings',
        ];

        $exportData = [];
        foreach ($tables as $table) {
            try {
                $exportData[$table] = DB::table($table)->get()->toArray();
            } catch (\Throwable $e) {
                $this->warn("Skipping table {$table}: " . $e->getMessage());
            }
        }

        $filename = 'al_noor_grocery_backup_' . date('Ymd_His') . '.json';
        $path = $backupDir . '/' . $filename;

        File::put($path, json_encode($exportData, JSON_PRETTY_PRINT));

        $this->info("Backup exported successfully to: {$path}");
        return 0;
    }
}
