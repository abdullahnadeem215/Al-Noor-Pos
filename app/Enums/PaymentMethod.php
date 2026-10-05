<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case CASH = 'cash';
    case BANK = 'bank';
    case CARD = 'card';
    case ONLINE = 'online';
    case CREDIT = 'credit';
}
