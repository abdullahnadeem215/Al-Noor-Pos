<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        Setting::set('business_name', 'AL-NOOR STORE', 'Shop Name');
        Setting::set('address', 'Yousafabad, Street #4, Faisalabad, Pakistan', 'Physical Address');
        Setting::set('phone', '', 'Contact Phone');
        Setting::set('email', 'info@alnoorstore.com', 'Business Email');
        Setting::set('currency', 'PKR', 'Currency Symbol/Code');
        Setting::set('timezone', 'Asia/Karachi', 'Application Timezone');
        Setting::set('invoice_prefix', 'INV-', 'Sale Invoice Prefix');
        Setting::set('low_stock_threshold', 1000, 'Low Stock Alert Threshold');
        Setting::set('negative_stock_allowed', false, 'Allow Sales When Stock Is Negative');
    }
}
