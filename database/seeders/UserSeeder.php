<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Owner User
        User::updateOrCreate(
            ['email' => 'owner@alnoormart.com'],
            [
                'name' => 'Al-Noor Owner',
                'password' => Hash::make('password123'),
                'role' => UserRole::OWNER,
                'status' => 'active',
            ]
        );

        // Cashier User
        User::updateOrCreate(
            ['email' => 'cashier@alnoormart.com'],
            [
                'name' => 'Mohammad Ali (Cashier)',
                'password' => Hash::make('password123'),
                'role' => UserRole::CASHIER,
                'status' => 'active',
            ]
        );
    }
}
