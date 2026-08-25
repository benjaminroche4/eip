<?php

namespace Tests\Feature;

use App\Domain\Blog\Exceptions\SanityRequestFailed;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Blog listing + article pages, backed by Sanity (faked here — no network). */
class BlogTest extends TestCase
{
    /** @return array<string, mixed> */
    private function doc(string $lang = 'fr', string $slug = 'acheter-a-paris', bool $withBody = false): array
    {
        return array_merge([
            '_id' => "post-$lang",
            '_createdAt' => '2026-03-01T08:00:00Z',
            'title' => $lang === 'fr' ? 'Acheter un appartement à Paris : le guide complet 2026 pour bien démarrer' : 'Buying an apartment in Paris: the complete 2026 guide',
            'slug' => $slug,
            'language' => $lang,
            'shortDescription' => 'Résumé court de l\'article.',
            'readTime' => 7,
            'publishedAt' => '2026-03-02T09:00:00Z',
            'updatedAt' => '2026-03-10T09:00:00Z',
            'mainPhoto' => ['alt' => 'Vue de Paris', 'asset' => ['_ref' => 'image-abc123-1600x900-jpg']],
            'category' => ['name' => 'Achat', 'slug' => 'achat'],
            'authors' => [['fullName' => 'Jean Dupont', 'slug' => 'jean-dupont']],
        ], $withBody ? [
            'metaDescription' => 'Tout ce qu\'il faut savoir pour acheter un appartement à Paris en 2026 : quartiers, prix au mètre carré, frais de notaire et étapes clés. Découvrez le guide.',
            'tags' => ['achat', 'paris'],
            'translations' => [['lang' => 'en', 'slug' => 'buying-in-paris'], ['lang' => 'fr', 'slug' => $slug]],
            'body' => [
                ['_key' => 'w1', '_type' => 'wysiwygBlock', 'title' => 'Introduction', 'content' => [
                    ['_key' => 'b1', '_type' => 'block', 'style' => 'normal', 'children' => [['_key' => 's1', '_type' => 'span', 'text' => 'Premier paragraphe.', 'marks' => []]], 'markDefs' => []],
                    ['_key' => 'i1', '_type' => 'image', 'alt' => 'Salon', 'asset' => ['_ref' => 'image-def456-1200x800-webp']],
                ]],
                ['_key' => 'f1', '_type' => 'faqBlock', 'items' => [
                    ['_key' => 'q1', 'question' => 'Q1 ?', 'answer' => 'R1.'],
                    ['_key' => 'q2', 'question' => 'Q2 ?', 'answer' => 'R2.'],
                    ['_key' => 'q3', 'question' => 'Q3 ?', 'answer' => 'R3.'],
                ]],
            ],
        ] : []);
    }

    /** Routes GROQ queries to canned results: listing ({items,total}), article (single doc or null), sitemap (list). */
    private function fakeSanity(?array $article, int $total = 1): void
    {
        Http::fake(function (Request $request) use ($article, $total) {
            $this->assertStringContainsString('ks9vwq45', $request->url());
            $this->assertSame('Bearer '.config('services.sanity.token'), $request->header('Authorization')[0]);
            $query = $request->data()['query'] ?? '';

            if (str_contains($query, '"total"')) {
                return Http::response(['result' => ['items' => [$this->doc()], 'total' => $total]]);
            }
            if (str_contains($query, '$slug')) {
                return Http::response(['result' => $article]);
            }

            return Http::response(['result' => [['slug' => 'acheter-a-paris', 'language' => 'fr', 'updatedAt' => '2026-03-10T09:00:00Z', 'translations' => [['lang' => 'en', 'slug' => 'buying-in-paris']]]]]);
        });
    }

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.sanity.project_id' => 'ks9vwq45', 'services.sanity.token' => 'secret-token', 'services.sanity.use_cdn' => false]);
    }

    public function test_listing_renders_posts_with_seo_props(): void
    {
        $this->withLocale('fr');
        $this->fakeSanity(null);

        $this->get('/blog')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('blog/index')
            ->where('posts.total', 1)
            ->where('posts.last_page', 1)
            ->where('posts.data.0.title', 'Acheter un appartement à Paris : le guide complet 2026 pour bien démarrer')
            ->where('posts.data.0.url', url('/blog/acheter-a-paris'))
            ->where('posts.data.0.image.width', 1600)
            ->where('posts.data.0.category.name', 'Achat')
            ->where('indexing.noindex', false)
            ->where('indexing.next', null));
    }

    public function test_listing_pagination_is_noindex_with_prev_next(): void
    {
        $this->withLocale('fr');
        $this->fakeSanity(null, total: 30);

        $this->get('/blog?page=2')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('posts.current_page', 2)
            ->where('posts.last_page', 3)
            ->where('indexing.noindex', true)
            ->where('indexing.prev', url('/blog'))
            ->where('indexing.next', url('/blog?page=3')));

        Http::assertSent(fn (Request $r) => ($r->data()['$from'] ?? null) === '12' && ($r->data()['$to'] ?? null) === '24');
    }

    public function test_english_listing_uses_the_en_prefix_and_locale_param(): void
    {
        $this->withLocale('en');
        $this->fakeSanity(null);

        $this->get('/en/blog')->assertOk()->assertInertia(fn (Assert $page) => $page->component('blog/index'));
        Http::assertSent(fn (Request $r) => ($r->data()['$lang'] ?? null) === '"en"');
    }

    public function test_article_page_exposes_body_faqs_and_translated_alternates(): void
    {
        $this->withLocale('fr');
        $this->fakeSanity($this->doc(withBody: true));

        $this->get('/blog/acheter-a-paris')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('blog/show')
            ->where('post.slug', 'acheter-a-paris')
            ->where('post.seo_title', 'Acheter un appartement à Paris : le guide…') // 42 chars + ' · Estate in Paris' = 60
            ->where('post.body.0._type', 'wysiwygBlock')
            ->where('post.body.0.content.1.image.width', 1200)
            ->where('post.body.0.content.1.image.url', 'https://cdn.sanity.io/images/ks9vwq45/production/def456-1200x800.webp?w=1200&auto=format&fit=max')
            ->count('post.faqs', 3)
            ->where('post.tags', ['achat', 'paris'])
            ->where('alternates.fr', url('/blog/acheter-a-paris'))
            ->where('alternates.en', url('/en/blog/buying-in-paris'))
            ->where('alternates.x-default', url('/blog/acheter-a-paris'))
            // language switcher follows the translated slug, not the current one
            ->where('localization.alternates.en', url('/en/blog/buying-in-paris'))
            ->where('localization.alternates.fr', url('/blog/acheter-a-paris')));

        $this->assertLessThanOrEqual(60, mb_strlen('Acheter un appartement à Paris : le guide…'.config('seo.title_separator').config('seo.site_name')));
    }

    public function test_article_without_translation_sends_switcher_to_the_blog_index(): void
    {
        $doc = $this->doc(withBody: true);
        $doc['translations'] = null;

        $this->withLocale('fr');
        $this->fakeSanity($doc);

        $this->get('/blog/acheter-a-paris')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->missing('alternates.en')
            ->where('localization.alternates.en', url('/en/blog')));
    }

    public function test_unknown_article_is_404(): void
    {
        $this->withLocale('fr');
        $this->fakeSanity(null);

        $this->get('/blog/nope')->assertNotFound();
    }

    public function test_sanity_failure_is_a_server_error_not_an_empty_page(): void
    {
        $this->withLocale('fr');
        Http::fake(fn () => Http::response(['error' => 'boom'], 500));
        $this->withoutExceptionHandling();

        $this->expectException(SanityRequestFailed::class);
        $this->get('/blog');
    }

    public function test_blog_urls_are_in_the_sitemap_and_llms_txt(): void
    {
        $this->withLocale('fr');
        $this->fakeSanity(null);

        $this->artisan('sitemap:generate')->assertSuccessful();
        $xml = file_get_contents(public_path('sitemap.xml'));
        $this->assertStringContainsString('<loc>'.url('/blog').'</loc>', $xml);
        $this->assertStringContainsString('<loc>'.url('/en/blog').'</loc>', $xml);
        $this->assertStringContainsString('<loc>'.url('/blog/acheter-a-paris').'</loc>', $xml);
        $this->assertStringContainsString('hreflang="en" href="'.url('/en/blog/buying-in-paris').'"', $xml);

        $this->get('/llms.txt')->assertOk()->assertSee(url('/blog'))->assertSee(url('/en/blog'));
    }

    public function test_sitemap_survives_a_sanity_outage(): void
    {
        $this->withLocale('fr');
        Http::fake(fn () => Http::response('down', 503));

        $this->artisan('sitemap:generate')->assertSuccessful();
        $this->assertStringContainsString('<loc>'.url('/blog').'</loc>', file_get_contents(public_path('sitemap.xml')));
    }
}
