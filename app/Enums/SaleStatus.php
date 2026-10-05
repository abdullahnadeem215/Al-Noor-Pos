<?php

namespace App\Enums;

enum SaleStatus: string
{
    case COMPLETED = 'completed';
    case RETURNED = 'returned';
    case PARTIAL_RETURN = 'partial_return';
    case CANCELLED = 'cancelled';
}
