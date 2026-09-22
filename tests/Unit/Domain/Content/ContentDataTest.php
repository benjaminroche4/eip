<?php

namespace Tests\Unit\Domain\Content;

use App\Domain\Content\Data\District;
use App\Domain\Content\Data\FaqCategory;
use App\Domain\Content\Data\FaqExcerpt;
use App\Domain\Content\Data\FaqItem;
use App\Domain\Content\Data\Stat;
use App\Domain\Content\Data\Strategy;
use App\Domain\Content\Data\SuccessStory;
use App\Domain\Content\Data\TeamMember;
use App\Domain\Content\Data\Testimonial;
use App\Domain\Content\Support\ArrayShape;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/** The content DTOs mirror one item of lang/{locale}/ui.php: `fromArray()` is the guard ui.php lacks, `toArray()` the exact prop shape. */
class ContentDataTest extends TestCase
{
    /** @return array<string, array{class-string, array<string, mixed>}> */
    public static function completeItems(): array
    {
        return [
            'team member' => [TeamMember::class, ['name' => 'Alexandre Moreau', 'role' => 'Conseiller senior', 'languages' => 'Parle français et anglais', 'flags' => ['FR', 'GB'], 'photo' => '/images/team/member-1.jpg']],
            'testimonial with photo' => [Testimonial::class, ['name' => 'Sophie M.', 'context' => "Achat d'un loft", 'quote' => 'Parfait.', 'photo' => '/images/testimonials/client-1.jpg']],
            'success story' => [SuccessStory::class, ['title' => '12 % au-dessus', 'place' => 'Paris 16e', 'duration' => '28 jours', 'result' => '+12 %', 'photo' => '/images/stories/story-1-{w}.jpg', 'alt' => 'Séjour']],
            'stat' => [Stat::class, ['value' => '250 M€+', 'title' => 'Transactions réalisées', 'text' => 'Dans Paris.']],
            'district' => [District::class, ['name' => 'Paris 6e', 'area' => 'Saint-Germain-des-Prés', 'text' => 'Élégance.', 'price' => '≈ 14 500 €/m²', 'tags' => ['Forte demande'], 'photo_alt' => 'Salon']],
            'strategy' => [Strategy::class, ['title' => 'Plus-value', 'text' => 'Acquérez.']],
        ];
    }

    /** @param class-string<TeamMember|Testimonial|SuccessStory|Stat|District|Strategy> $class */
    #[DataProvider('completeItems')]
    public function test_to_array_gives_back_exactly_the_ui_php_item(string $class, array $item): void
    {
        $this->assertSame($item, $class::fromArray($item)->toArray());
    }

    /** @param class-string<TeamMember|Testimonial|SuccessStory|Stat|District|Strategy> $class */
    #[DataProvider('completeItems')]
    public function test_a_missing_key_is_reported_by_name(string $class, array $item): void
    {
        $missing = array_key_first($item); // the first key is required on every DTO (the last one may be optional, e.g. a testimonial photo)
        unset($item[$missing]);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage("$class from ui.php is missing the key(s) \"$missing\"");
        $class::fromArray($item);
    }

    public function test_a_wrong_type_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('"flags" must be a array, string given');
        TeamMember::fromArray(['name' => 'A', 'role' => 'B', 'languages' => 'C', 'flags' => 'FR', 'photo' => '/p.jpg']);
    }

    public function test_array_shape_lists_every_missing_key_and_the_keys_it_got(): void
    {
        try {
            ArrayShape::validate('Thing', ['b' => 'x'], ['a' => 'string', 'b' => 'string', 'c' => 'array']);
            $this->fail('expected an exception');
        } catch (InvalidArgumentException $e) {
            $this->assertSame('Thing from ui.php is missing the key(s) "a", "c" (got: b).', $e->getMessage());
        }

        ArrayShape::validate('Thing', ['a' => 'x', 'p' => null], ['a' => 'string'], ['p' => 'string']); // an optional key may be absent or null
        $this->assertTrue(true);
    }

    public function test_testimonial_photo_is_optional_and_omitted_from_the_props_when_absent(): void
    {
        $withoutPhoto = Testimonial::fromArray(['name' => 'Marc V.', 'context' => 'Investissement', 'quote' => 'Précis.']);

        $this->assertNull($withoutPhoto->photo);
        $this->assertSame(['name' => 'Marc V.', 'context' => 'Investissement', 'quote' => 'Précis.'], $withoutPhoto->toArray());
        $this->assertArrayNotHasKey('photo', $withoutPhoto->toArray());
    }

    public function test_faq_category_and_items_get_their_anchor_slugs_and_can_be_taken(): void
    {
        $category = FaqCategory::fromArray(['key' => 'buying', 'title' => 'Acheter un bien', 'items' => [
            ['question' => 'Un étranger peut-il acheter un bien immobilier à Paris ?', 'answer' => 'Oui.'],
            ['question' => 'Quels frais ?', 'answer' => 'Environ 7 %.'],
        ]]);

        $this->assertSame('acheter-un-bien', $category->slug);
        $this->assertContainsOnlyInstancesOf(FaqItem::class, $category->items);
        $this->assertSame([
            'key' => 'buying',
            'title' => 'Acheter un bien',
            'items' => [
                ['question' => 'Un étranger peut-il acheter un bien immobilier à Paris ?', 'answer' => 'Oui.', 'slug' => 'un-etranger-peut-il-acheter-un-bien-immobilier-a-paris'],
                ['question' => 'Quels frais ?', 'answer' => 'Environ 7 %.', 'slug' => 'quels-frais'],
            ],
            'slug' => 'acheter-un-bien',
        ], $category->toArray());

        $this->assertCount(1, $category->take(1)->items);
        $this->assertCount(2, $category->items, 'take() never mutates');

        $excerpt = FaqExcerpt::of($category, 1);
        $this->assertSame(['slug' => 'acheter-un-bien', 'items' => [['question' => 'Un étranger peut-il acheter un bien immobilier à Paris ?', 'answer' => 'Oui.', 'slug' => 'un-etranger-peut-il-acheter-un-bien-immobilier-a-paris']]], $excerpt->toArray());
        $this->assertSame(['slug' => '', 'items' => []], FaqExcerpt::empty()->toArray());
    }

    public function test_a_faq_question_without_an_answer_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage(FaqItem::class.' from ui.php is missing the key(s) "answer"');
        FaqCategory::fromArray(['key' => 'buying', 'title' => 'Acheter', 'items' => [['question' => 'Combien ?']]]);
    }
}
