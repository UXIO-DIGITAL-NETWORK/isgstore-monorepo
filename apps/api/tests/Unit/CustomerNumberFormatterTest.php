<?php

namespace Tests\Unit;

use App\Models\Category;
use App\Services\CustomerNumberFormatter;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class CustomerNumberFormatterTest extends TestCase
{
    private CustomerNumberFormatter $formatter;

    protected function setUp(): void
    {
        parent::setUp();
        $this->formatter = new CustomerNumberFormatter;
    }

    /** Build an unsaved Category — no DB needed, the formatter only reads the cast attribute. */
    private function category(?array $schema): Category
    {
        $category = new Category;
        $category->order_form_fields = $schema;

        return $category;
    }

    private function mlbbSchema(string $template = '{user_id}{zone_id}'): array
    {
        return [
            'customer_no_template' => $template,
            'fields' => [
                ['key' => 'user_id', 'label' => 'User ID', 'type' => 'number', 'required' => true],
                ['key' => 'zone_id', 'label' => 'Zone ID', 'type' => 'number', 'required' => true],
            ],
        ];
    }

    public function test_unconfigured_category_uses_the_pipe_joined_default(): void
    {
        // uxiotopup's documented target shape: "dataId|zoneId", or just the
        // dataId when there is no zone/server component.
        $this->assertSame('123456789|2001', $this->formatter->format($this->category(null), '123456789', '2001'));
        $this->assertSame('123456789', $this->formatter->format($this->category(null), '123456789', null));
        $this->assertSame('123456789', $this->formatter->format($this->category([]), '123456789', null));
        $this->assertSame('123456789', $this->formatter->format(null, '123456789', null));
    }

    public function test_two_field_schema_joins_by_template(): void
    {
        $this->assertSame(
            '1234567892001',
            $this->formatter->format($this->category($this->mlbbSchema()), '123456789', '2001')
        );
    }

    public function test_template_can_reorder_and_add_a_separator(): void
    {
        $this->assertSame(
            '2001|123456789',
            $this->formatter->format($this->category($this->mlbbSchema('{zone_id}|{user_id}')), '123456789', '2001')
        );
    }

    public function test_single_field_schema_ignores_a_stray_target_server(): void
    {
        $schema = [
            'customer_no_template' => '{user_id}',
            'fields' => [
                ['key' => 'user_id', 'label' => 'Player ID', 'type' => 'number', 'required' => true],
            ],
        ];

        $this->assertSame(
            '123456789',
            $this->formatter->format($this->category($schema), '123456789', '9999')
        );
    }

    public function test_values_are_trimmed(): void
    {
        $this->assertSame(
            '1234567892001',
            $this->formatter->format($this->category($this->mlbbSchema()), '  123456789 ', " 2001\n")
        );
    }

    public function test_legacy_list_shape_is_still_parsed_and_joined_in_order(): void
    {
        $legacyList = [
            ['key' => 'user_id', 'label' => 'User ID', 'required' => true],
            ['key' => 'zone_id', 'label' => 'Zone ID', 'required' => true],
        ];

        $this->assertSame(
            '1234567892001',
            $this->formatter->format($this->category($legacyList), '123456789', '2001')
        );
    }

    public function test_missing_required_field_throws(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Zone ID wajib diisi');

        $this->formatter->format($this->category($this->mlbbSchema()), '123456789', '');
    }

    public function test_optional_field_may_be_empty(): void
    {
        $schema = [
            'customer_no_template' => '{user_id}{zone_id}',
            'fields' => [
                ['key' => 'user_id', 'label' => 'User ID', 'required' => true],
                ['key' => 'zone_id', 'label' => 'Zone ID', 'required' => false],
            ],
        ];

        $this->assertSame('123456789', $this->formatter->format($this->category($schema), '123456789', null));
    }

    public function test_template_referencing_an_unknown_field_throws(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Template customer_no tidak valid');

        $this->formatter->format($this->category($this->mlbbSchema('{user_id}{server_id}')), '123456789', '2001');
    }

    public function test_more_than_two_fields_are_truncated_to_the_stored_columns(): void
    {
        $schema = [
            'customer_no_template' => '{a}{b}',
            'fields' => [
                ['key' => 'a', 'label' => 'A', 'required' => true],
                ['key' => 'b', 'label' => 'B', 'required' => true],
                ['key' => 'c', 'label' => 'C', 'required' => true],
            ],
        ];

        // Only two columns exist, so the third field is dropped rather than
        // silently binding to nothing.
        $this->assertSame('12', $this->formatter->format($this->category($schema), '1', '2'));
    }
}
