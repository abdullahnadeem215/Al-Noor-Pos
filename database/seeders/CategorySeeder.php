<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::where('email', 'owner@alnoormart.com')->first();

        $categories = [
            ['name' => 'Daal', 'description' => 'Pulses and lentils'],
            ['name' => 'Chawal', 'description' => 'Basmati and coarse rice varieties'],
            ['name' => 'Sugar', 'description' => 'Refined white and brown sugar'],
            ['name' => 'Flour', 'description' => 'Wheat flour, maida, and chakki atta'],
            ['name' => 'Beverages', 'description' => 'Tea, soft drinks, juices, and water'],
            ['name' => 'Personal Care', 'description' => 'Soap, toothpaste, shampoo, and toiletries'],
            ['name' => 'Biscuits', 'description' => 'Packaged biscuits and snacks'],
            ['name' => 'Spices', 'description' => 'Red chili, turmeric, cumin, and mixed spices'],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(
                ['name' => $cat['name']],
                [
                    'description' => $cat['description'],
                    'status' => 'active',
                    'created_by' => $owner?->id,
                ]
            );
        }
    }
}
