<?php

namespace App\Enums;

enum StockUnit: string
{
    case GRAM = 'gram';
    case KG = 'kg';
    case PIECE = 'piece';
    case PACKET = 'packet';
    case BOX = 'box';
    case BOTTLE = 'bottle';
    case PACK = 'pack';
    case UNIT = 'unit';
}
