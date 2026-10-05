<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class CategoryService
{
    public function listCategories(array $filters = []): LengthAwarePaginator
    {
        $query = Category::query()->withCount('products');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where('name', 'ILIKE', "%{$search}%");
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $perPage = (int) ($filters['per_page'] ?? 15);

        return $query->latest()->paginate($perPage);
    }

    public function createCategory(array $data, ?int $userId = null): Category
    {
        $data['created_by'] = $userId;
        $data['status'] = $data['status'] ?? 'active';

        return Category::create($data);
    }

    public function updateCategory(Category $category, array $data): Category
    {
        $category->update($data);

        return $category->fresh();
    }

    public function deleteCategory(Category $category): bool
    {
        if ($category->products()->count() > 0) {
            throw ValidationException::withMessages([
                'category' => ["Cannot delete category '{$category->name}' because it contains active products."],
            ]);
        }

        return (bool) $category->delete();
    }
}
