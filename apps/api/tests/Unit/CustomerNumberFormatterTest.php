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
        // uxiolabs's documented target shape: "dataId|zoneId", or just the
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

    public function test_legacy_list_shape_defaults_to_the_pipe_joined_form(): void
    {
        // No explicit template → default to uxiolabs's "dataId|zoneId" (pipe),
        // not bare concatenation which the supplier rejects.
        $legacyList = [
            ['key' => 'user_id', 'label' => 'User ID', 'required' => true],
            ['key' => 'zone_id', 'label' => 'Zone ID', 'required' => true],
        ];

        $this->assertSame(
            '123456789|2001',
            $this->formatter->format($this->category($legacyList), '123456789', '2001')
        );
    }

    public function test_a_schema_without_a_template_pipe_joins_by_default(): void
    {
        $schema = [
            'fields' => [
                ['key' => 'user_id', 'label' => 'User ID', 'required' => true],
                ['key' => 'zone_id', 'label' => 'Zone ID', 'required' => true],
            ],
        ];

        $this->assertSame(
            '123456789|2001',
            $this->formatter->format($this->category($schema), '123456789', '2001')
        );
    }

    public function test_default_pipe_template_drops_the_separator_for_an_empty_optional_field(): void
    {
        // Two declared fields, second optional and left blank → "dataId", no
        // trailing "dataId|".
        $legacyList = [
            ['key' => 'user_id', 'label' => 'User ID', 'required' => true],
            ['key' => 'zone_id', 'label' => 'Zone ID', 'required' => false],
        ];

        $this->assertSame(
            '123456789',
            $this->formatter->format($this->category($legacyList), '123456789', null)
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

    public function test_positional_input_cannot_fill_a_third_identifier_and_says_so(): void
    {
        // Two mirrored columns, three declared fields. Composing a target with a
        // piece missing would either be rejected by the supplier or — worse —
        // resolve to somebody else's account, so this fails loudly instead.
        $schema = [
            'customer_no_template' => '{a}|{b}|{c}',
            'fields' => [
                ['key' => 'a', 'label' => 'A', 'required' => true],
                ['key' => 'b', 'label' => 'B', 'required' => true],
                ['key' => 'c', 'label' => 'C', 'required' => true],
            ],
        ];

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('C wajib diisi');

        $this->formatter->format($this->category($schema), '1', '2');
    }

    public function test_keyed_values_bind_as_many_identifiers_as_the_category_declares(): void
    {
        $schema = [
            'customer_no_template' => '{a}|{b}|{c}',
            'fields' => [
                ['key' => 'a', 'label' => 'A', 'required' => true],
                ['key' => 'b', 'label' => 'B', 'required' => true],
                ['key' => 'c', 'label' => 'C', 'required' => true],
            ],
        ];

        $this->assertSame(
            '1|2|3',
            $this->formatter->formatMap($this->category($schema), ['a' => '1', 'b' => '2', 'c' => '3'])
        );
    }

    public function test_keyed_values_are_trimmed_and_undeclared_keys_dropped(): void
    {
        // mlbbSchema() joins without a separator, so trimming shows up as the
        // absence of stray spaces rather than in the join itself.
        $this->assertSame(
            '1234567892001',
            $this->formatter->formatMap($this->category($this->mlbbSchema()), [
                'user_id' => ' 123456789 ',
                'zone_id' => '2001',
                // Not declared by the schema, so it never reaches the supplier.
                'smurf' => '999',
            ])
        );
    }

    public function test_keyed_values_drop_the_separator_for_an_empty_optional_field(): void
    {
        $schema = [
            'customer_no_template' => '{user_id}|{zone_id}',
            'fields' => [
                ['key' => 'user_id', 'label' => 'User ID', 'required' => true],
                ['key' => 'zone_id', 'label' => 'Zone ID', 'required' => false],
            ],
        ];

        $this->assertSame(
            '123456789',
            $this->formatter->formatMap($this->category($schema), ['user_id' => '123456789'])
        );
    }

    public function test_keyed_values_still_refuse_a_missing_required_identifier(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Zone ID wajib diisi');

        $this->formatter->formatMap($this->category($this->mlbbSchema()), ['user_id' => '123456789']);
    }
}
