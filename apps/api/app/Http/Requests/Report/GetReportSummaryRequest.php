<?php

declare(strict_types=1);

namespace App\Http\Requests\Report;

use App\DTOs\Report\ReportSummaryDTO;
use App\Support\DateTime\Wib;
use App\Support\Report\PeriodResolver;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GetReportSummaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'period' => ['nullable', Rule::in(PeriodResolver::PERIODS)],

            // date_format:Y-m-d rather than the house 'date' rule on purpose:
            // 'date' also accepts "2026-09-02T17:00:00.000Z", which smuggles
            // back the timezone ambiguity this endpoint exists to remove. The
            // client sends a calendar day; the server decides what instant
            // that day starts at.
            'date_from' => ['required_if:period,custom', 'nullable', 'date_format:Y-m-d'],
            'date_to' => ['required_if:period,custom', 'nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $from = $this->input('date_from');
            $to = $this->input('date_to');

            if ($validator->errors()->isNotEmpty() || ! $from || ! $to) {
                return;
            }

            // The breakdown tables are unpaginated, so an unbounded range is a
            // rendering problem long before it is a query problem.
            $days = strtotime($to) === false || strtotime($from) === false
                ? 0
                : (int) floor((strtotime($to) - strtotime($from)) / 86400) + 1;

            if ($days > PeriodResolver::MAX_CUSTOM_DAYS) {
                $validator->errors()->add(
                    'date_to',
                    'The selected range may not be longer than '.PeriodResolver::MAX_CUSTOM_DAYS.' days.'
                );
            }
        });
    }

    public function toDTO(): ReportSummaryDTO
    {
        return ReportSummaryDTO::fromValidated(
            $this->validated(),
            $this->user()?->timezone ?? Wib::TZ
        );
    }
}
