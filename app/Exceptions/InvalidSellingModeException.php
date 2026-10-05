<?php

namespace App\Exceptions;

use Exception;

class InvalidSellingModeException extends Exception
{
    protected $code = 422;
}
