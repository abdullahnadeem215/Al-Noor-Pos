<?php

namespace App\Enums;

enum MovementType: string
{
    case OPENING_STOCK = 'opening_stock';
    case PURCHASE = 'purchase';
    case SALE = 'sale';
    case SALE_RETURN = 'sale_return';
    case PURCHASE_RETURN = 'purchase_return';
    case ADJUSTMENT = 'adjustment';
}
