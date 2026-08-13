<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * One handed-over datum — a username, an endpoint, an API key.
 *
 * `value` is encrypted for every row, secret or not, so there is no branch in
 * which a value is written in the clear.
 */
class ServiceInstallationDetail extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'value' => 'encrypted',
        'is_secret' => 'boolean',
    ];

    /**
     * Keeps plaintext out of toArray()/toJson() — and therefore out of dd(),
     * out of Log::info($model), and out of a careless `return $model` from a
     * controller. Resources read the attribute directly, so exposing a value
     * stays an explicit, greppable decision.
     *
     * @var list<string>
     */
    protected $hidden = ['value'];

    public function installation()
    {
        return $this->belongsTo(ServiceInstallation::class, 'service_installation_id');
    }

    /** What a secret looks like in a list: the last four characters only. */
    public function maskedValue(): string
    {
        $value = (string) $this->value;

        // Too short to reveal any of it without giving away most of it.
        if (mb_strlen($value) <= 4) {
            return str_repeat('•', 8);
        }

        return str_repeat('•', 8).mb_substr($value, -4);
    }
}
