<?php

namespace App\Enums;

enum UserRole: string
{
    case OWNER = 'owner';
    case CASHIER = 'cashier';
    case MANAGER = 'manager';
    case INVENTORY = 'inventory';
    case ACCOUNTANT = 'accountant';

    public function label(): string
    {
        return ucfirst($this->value);
    }
}
