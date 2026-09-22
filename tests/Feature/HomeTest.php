<?php

namespace Tests\Feature;

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Home page: full-bleed hero (Figma 712-26754) with the answer-first sentence, in both languages. */
class HomeTest extends TestCase
{
    /** @return array<string, mixed> */
    private function doc(string $lang, string $slug): array
    {
        return [
            '_id' => "post-$slug",
            '_createdAt' => '2026-03-01T08:00:00Z',
            'title' => "Article $slug",
            'slug' => $slug,
            'language' => $lang,
            'shortDescription' => 'Résumé.',
            'readTime' => 5,
            'publishedAt' => '2026-03-02T09:00:00Z',
            'updatedAt' => '2026-03-02T09:00:00Z',
            'mainPhoto' => ['alt' => 'Vue', 'asset' => ['_ref' => 'image-abc123-1600x900-jpg']],
            'category' => ['name' => 'Achat', 'slug' => 'achat', 'color' => '#C2A878'],
            'authors' => [],
        ];
    }

    /** Sanity listing faked (no network): three articles of the requested locale. */
    private function fakeSanity(): void
    {
        Http::fake(function (Request $request) {
            $lang = $request->data()['$lang'] ?? '"fr"';
            // GROQ params travel JSON-encoded (« "fr" », « 3 »)
            $this->assertSame('0', $request->data()['$from'] ?? null);
            $this->assertSame('3', $request->data()['$to'] ?? null, 'the home preview asks for three articles');
            $lang = trim($lang, '"');

            return Http::response(['result' => ['items' => [$this->doc($lang, "$lang-1"), $this->doc($lang, "$lang-2"), $this->doc($lang, "$lang-3")], 'total' => 3, 'all' => 3, 'featured' => null, 'categories' => []]]);
        });
    }

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.sanity.project_id' => 'ks9vwq45', 'services.sanity.token' => 'secret-token', 'services.sanity.use_cdn' => false, 'services.sanity.blog_type' => 'estateBlog']);
    }

    public function test_home_shares_its_headline_and_intro_in_both_languages(): void
    {
        $this->fakeSanity();
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('home')
                ->where('translations.home.hero_title_1', "L'agence de l'exceptionnel")
                ->where('translations.home.hero_text', fn (string $text) => str_contains($text, 'Estate in Paris') && str_contains($text, 'off-market'))
                ->where('figure', '500+')
                ->has('posts', 3)
                ->where('posts.0.slug', 'fr-1')
                ->where('translations.home.blog_intro', fn (string $text) => str_contains($text, 'Estate in Paris') && str_contains($text, 'Paris'))
                ->where('translations.home.trust_text', fn (string $text) => str_contains($text, 'Estate in Paris') && str_contains($text, 'Paris'))
                ->has('testimonials', 10)
                ->has('stories', 6)
                ->where('faq.slug', 'travailler-avec-estate-in-paris')
                ->has('faq.items', 6)
                ->where('translations.about.manifesto_title', 'Qui sommes-nous ?')
                ->where('translations.home.faq.intro', fn (string $text) => str_contains($text, 'Estate in Paris') && str_contains($text, 'Paris'))
                ->where('stories.0.place', 'Paris 16e')
                ->where('testimonials.0.name', 'Sophie M.')
                ->where('testimonials.0.photo', '/images/testimonials/client-1.jpg'));

        foreach (['client-1', 'client-2', 'client-3'] as $portrait) {
            $this->assertFileExists(public_path("images/testimonials/$portrait.jpg"));
        }

        $this->withLocale('en'); // re-creates the app: fake Sanity again
        $this->fakeSanity();
        $this->get('/en')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('home')->where('translations.home.hero_title_2', 'Exceptional in Paris.')->where('testimonials.1.context', 'Sold a penthouse in Paris 16'));
    }

    public function test_home_hides_the_blog_preview_when_sanity_fails(): void
    {
        Http::fake(fn () => Http::response('Service unavailable', 503));

        $this->get('/')->assertOk()->assertInertia(fn (Assert $p) => $p->component('home')->where('posts', []));
    }
}
