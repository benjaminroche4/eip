<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** FAQ page: categories and questions from lang/ui.php in the visitor's language, enough of them for a FAQPage, GEO texts present. */
class FaqTest extends TestCase
{
    public function test_faq_page_serves_the_localized_categories(): void
    {
        $this->get('/questions-frequentes')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('faq')
                ->has('categories', 4)
                ->where('categories.0.key', 'buying')
                ->where('categories.0.title', 'Acheter un bien')
                ->where('categories.0.slug', 'acheter-un-bien')
                ->has('categories.0.items', 10)
                ->where('categories.0.items.0.slug', 'un-etranger-peut-il-acheter-un-bien-immobilier-a-paris'));

        $this->withLocale('en')->get('/en/faq')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->where('categories.0.items.0.question', 'Can foreigners buy property in Paris?'));
    }

    public function test_every_question_has_a_self_contained_answer_in_both_languages(): void
    {
        foreach (['fr', 'en'] as $locale) {
            $categories = __('ui.faq.categories', [], $locale);
            $this->assertSame(['buying', 'selling', 'investing', 'working'], array_column($categories, 'key'), "[$locale] same categories in both languages");

            $questions = [];
            foreach ($categories as $category) {
                $this->assertCount(10, $category['items'], "[$locale] {$category['key']}: 10 questions");
                foreach ($category['items'] as $item) {
                    $this->assertStringEndsWith('?', $item['question']);
                    $this->assertGreaterThan(80, mb_strlen($item['answer']), "[$locale] answer too short to be quotable: {$item['question']}");
                    $questions[] = $item['question'];
                }
            }
            $this->assertSame(count($questions), count(array_unique($questions)), "[$locale] duplicated question");
            $slugs = array_map(fn ($q) => Str::slug($q), $questions);
            $this->assertSame(count($slugs), count(array_unique($slugs)), "[$locale] two questions share a URL anchor");
        }
    }

    public function test_answer_links_only_target_existing_routes(): void
    {
        foreach (['fr', 'en'] as $locale) {
            foreach (__('ui.faq.categories', [], $locale) as $category) {
                foreach ($category['items'] as $item) {
                    preg_match_all('/\]\(([a-z][a-z0-9_.]*)\)/', $item['answer'], $links);
                    foreach ($links[1] as $name) {
                        $this->assertTrue(Route::has($name), "[$locale] unknown route '$name' in: {$item['question']}");
                    }
                }
            }
        }
    }
}
