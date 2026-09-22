<?php

namespace Tests\Unit\Domain\Content;

use App\Domain\Content\Actions\ExcerptFaqCategory;
use App\Domain\Content\Actions\ListDistricts;
use App\Domain\Content\Actions\ListFaqCategories;
use App\Domain\Content\Actions\ListStats;
use App\Domain\Content\Actions\ListStrategies;
use App\Domain\Content\Actions\ListSuccessStories;
use App\Domain\Content\Actions\ListTeamMembers;
use App\Domain\Content\Actions\ListTestimonials;
use App\Domain\Content\Data\District;
use App\Domain\Content\Data\FaqCategory;
use App\Domain\Content\Data\Stat;
use App\Domain\Content\Data\Strategy;
use App\Domain\Content\Data\SuccessStory;
use App\Domain\Content\Data\TeamMember;
use App\Domain\Content\Data\Testimonial;
use App\Domain\Content\Support\ContentList;
use Tests\TestCase;

/** The content actions read every editorial list of lang/{locale}/ui.php, in both languages, into validated DTOs. */
class ContentActionsTest extends TestCase
{
    public function test_every_list_is_readable_in_both_languages_with_the_same_length(): void
    {
        $lists = [
            [ListTeamMembers::class, TeamMember::class, 6],
            [ListTestimonials::class, Testimonial::class, 10],
            [ListSuccessStories::class, SuccessStory::class, 2],
            [ListStats::class, Stat::class, 4],
            [ListDistricts::class, District::class, 4],
            [ListStrategies::class, Strategy::class, 3],
            [ListFaqCategories::class, FaqCategory::class, 4],
        ];

        foreach ($lists as [$action, $dto, $count]) {
            foreach (['fr', 'en'] as $locale) {
                $items = app($action)($locale);
                $this->assertCount($count, $items, "[$locale] $action");
                $this->assertContainsOnlyInstancesOf($dto, $items, "[$locale] $action");
            }
        }
    }

    public function test_the_locale_argument_selects_the_language_and_defaults_to_the_current_one(): void
    {
        $this->assertSame('Conseiller senior', app(ListTeamMembers::class)('fr')[0]->role);
        $this->assertSame('Senior property advisor', app(ListTeamMembers::class)('en')[0]->role);
        $this->assertSame('Transactions réalisées', app(ListStats::class)('fr')[0]->title);
        $this->assertSame('Transactions facilitated', app(ListStats::class)('en')[0]->title);
        $this->assertSame('Saint-Germain-des-Prés', app(ListDistricts::class)('en')[0]->area);
        $this->assertSame('Acheter un bien', app(ListFaqCategories::class)('fr')[0]->title);
        $this->assertSame('Buying property', app(ListFaqCategories::class)('en')[0]->title);

        app()->setLocale('en');
        $this->assertSame('Senior property advisor', app(ListTeamMembers::class)()[0]->role);
        app()->setLocale('fr');
        $this->assertSame('Conseiller senior', app(ListTeamMembers::class)()[0]->role);
    }

    public function test_stories_and_testimonials_keep_their_photos_when_ui_php_has_them(): void
    {
        $testimonials = app(ListTestimonials::class)('fr');
        $this->assertSame('/images/testimonials/client-1.jpg', $testimonials[0]->photo);
        $this->assertNull($testimonials[9]->photo, 'the last reviews have no portrait yet');
        $this->assertArrayNotHasKey('photo', $testimonials[9]->toArray());

        $this->assertStringContainsString('{w}', app(ListSuccessStories::class)('en')[0]->photo);
    }

    public function test_faq_excerpt_takes_the_first_questions_of_a_topic_by_its_key(): void
    {
        $excerpt = app(ExcerptFaqCategory::class)('buying', 6, 'fr');
        $this->assertSame('acheter-un-bien', $excerpt->slug);
        $this->assertCount(6, $excerpt->items);
        $this->assertSame('un-etranger-peut-il-acheter-un-bien-immobilier-a-paris', $excerpt->items[0]->slug);

        $this->assertSame('selling-property', app(ExcerptFaqCategory::class)('selling', 2, 'en')->slug);
        $this->assertCount(2, app(ExcerptFaqCategory::class)('selling', 2, 'en')->items);

        $this->assertSame(['slug' => '', 'items' => []], app(ExcerptFaqCategory::class)('unknown', 6, 'fr')->toArray());
    }

    public function test_content_list_converts_dtos_to_plain_arrays_in_order(): void
    {
        $stats = app(ListStats::class)('fr');
        $this->assertSame(__('ui.about.stats', [], 'fr'), ContentList::toArray($stats));
    }
}
