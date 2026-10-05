<?php

namespace App\Enums;

enum LedgerType: string
{
    case DEBIT = 'debit';
    case CREDIT = 'credit';
    case OPENING_BALANCE = 'opening_balance';
    case ADJUSTMENT = 'adjustment';
}
