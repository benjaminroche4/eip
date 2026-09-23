<?php

namespace Tests\Feature;

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** HTML sitemap page (« Plan du site » ↔ /en/sitemap), replacing the former terms page since 2026-09-22. */
class SitemapPageTest extends TestCase
{
    /** Sanity listing faked (no network): three articles (two categorised) of the requested locale. */
    private function fakeSanity(): void
    {
        Http::fake(function (Request $request) {
            $lang = trim($request->data()['$lang'] ?? '"fr"', '"');
            $this->assertSame('200', $request->data()['$to'] ?? null, 'the sitemap page lists up to 200 articles in one query');
            $doc = fn (string $slug, ?array $category) => ['_id' => "post-$slug", '_createdAt' => '2026-03-01T08:00:00Z', 'title' => "Article $slug", 'slug' => $slug, 'language' => $lang, 'shortDescription' => '', 'readTime' => 5, 'publishedAt' => '2026-03-02T09:00:00Z', 'updatedAt' => '2026-03-02T09:00:00Z', 'mainPhoto' => null, 'category' => $category, 'authors' => []];
            $achat = ['name' => 'Achat', 'slug' => 'achat', 'color' => null];

            // Two articles in « Achat », one without category, plus an empty category that must not appear
            return Http::response(['result' => ['items' => [$doc("$lang-1", $achat), $doc("$lang-2", $achat), $doc("$lang-3", null)], 'total' => 3, 'all' => 3, 'featured' => null, 'categories' => [['name' => 'Achat', 'slug' => 'achat', 'color' => null, 'count' => 2], ['name' => 'Vide', 'slug' => 'vide', 'color' => null, 'count' => 1]]]]);
        });
    }

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.sanity.project_id' => 'ks9vwq45', 'services.sanity.token' => 'secret-token', 'services.sanity.use_cdn' => false, 'services.sanity.blog_type' => 'estateBlog']);
    }

    public function test_sitemap_page_lists_every_public_page_and_the_blog_of_the_locale(): void
    {
        $this->fakeSanity();
        $this->get('/plan-du-site')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('sitemap')
                ->has('groups', 3)
                ->where('groups.0.title', 'Nos services')
                ->has('groups.0.links', 4)
                ->where('groups.0.links.0.label', 'Acheter')
                ->where('groups.0.links.0.href', url('/acheter-immobilier-paris'))
                ->where('groups.1.title', 'Pages du site')
                ->has('groups.1.links', 6) // home first, no search page (placeholder dataset)
                ->where('groups.1.links.0.href', url('/'))
                ->where('groups.1.links.3.href', url('/blog')) // home, about, arrondissements, blog…
                ->has('groups.2.links', 3)
                ->where('groups.2.links.2.href', url('/plan-du-site'))
                ->has('blog.categories', 1) // the empty category is left out
                ->where('blog.categories.0.href', url('/blog/categorie/achat'))
                ->has('blog.categories.0.posts', 2)
                ->where('blog.categories.0.posts.0.label', 'Article fr-1')
                ->where('blog.categories.0.posts.0.href', url('/blog/fr-1'))
                ->has('blog.other', 1)
                ->where('blog.other.0.href', url('/blog/fr-3'))
                ->where('translations.pages.sitemap.intro', fn (string $intro) => str_contains($intro, 'Estate in Paris') && str_contains($intro, 'Paris')));

        $this->withLocale('en'); // re-creates the app: fake Sanity again
        $this->fakeSanity();
        $this->get('/en/sitemap')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('sitemap')->where('groups.0.links.0.href', url('/en/buy-property-paris'))->where('groups.2.links.2.href', url('/en/sitemap'))->where('blog.categories.0.posts.1.href', url('/en/blog/en-2')));

        $this->withLocale('en')->get('/en/plan-du-site')->assertNotFound();
        $this->withLocale('fr')->get('/conditions-generales')->assertNotFound(); // the former terms page
    }

    public function test_sitemap_page_survives_a_sanity_failure(): void
    {
        Http::fake(fn () => Http::response('Service unavailable', 503));

        $this->get('/plan-du-site')->assertOk()->assertInertia(fn (Assert $p) => $p->has('groups', 3)->where('blog.categories', [])->where('blog.other', []));
    }
}
