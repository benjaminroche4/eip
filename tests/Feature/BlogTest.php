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
            'category' => ['name' => 'Achat', 'slug' => 'achat', 'color' => '#C2A878'],
            'authors' => [['fullName' => 'Jean Dupont', 'slug' => 'jean-dupont', 'photo' => ['asset' => ['_ref' => 'image-def456-80x80-webp']]]],
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
            $this->assertStringContainsString('_type == $type', $query, 'article queries must filter on the configured document type');
            $this->assertSame('"estateBlog"', $request->data()['$type'] ?? null, 'the shared Sanity project holds both sites: this one reads estateBlog');

            if (str_contains($query, '$categoryType') && ! str_contains($query, '"total"')) {
                return Http::response(['result' => [['slug' => 'achat', 'language' => 'fr'], ['slug' => 'buying', 'language' => 'en']]]);
            }
            if (str_contains($query, '"total"')) {
                $this->assertStringContainsString('_type == $categoryType', $query, 'the listing also fetches the categories with their counts');
                $this->assertSame('"estateCategory"', $request->data()['$categoryType'] ?? null);
                $this->assertSame(str_contains($query, 'slug.current == $category'), array_key_exists('$category', $request->data()), 'the category param is sent only when the listing is filtered');

                return Http::response(['result' => ['items' => [$this->doc()], 'total' => $total, 'all' => $total + 1, 'featured' => $this->doc(slug: 'dernier-article'), 'categories' => [
                    ['name' => 'Achat', 'slug' => 'achat', 'color' => '#C2A878', 'count' => $total],
                    ['name' => 'Vendre', 'slug' => 'vendre', 'color' => null, 'count' => 1],
                    ['name' => 'Vide', 'slug' => 'vide', 'color' => null, 'count' => 0],
                ]]]);
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
        config(['services.sanity.project_id' => 'ks9vwq45', 'services.sanity.token' => 'secret-token', 'services.sanity.use_cdn' => false, 'services.sanity.blog_type' => 'estateBlog']);
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
            ->where('posts.data.0.category.color', '#c2a878')
            ->where('posts.data.0.authors.0.name', 'Jean Dupont')
            ->where('posts.data.0.authors.0.photo', 'https://cdn.sanity.io/images/ks9vwq45/production/def456-80x80.webp?w=64&h=64&fit=crop&auto=format')
            ->where('filter.active', null)
            ->where('filter.total_all', 2)
            ->where('filter.categories', [
                ['name' => 'Achat', 'slug' => 'achat', 'color' => '#c2a878', 'count' => 1],
                ['name' => 'Vendre', 'slug' => 'vendre', 'color' => null, 'count' => 1],
            ])
            ->where('filter.urls.all', url('/blog'))
            ->where('filter.urls.achat', url('/blog/categorie/achat'))
            ->where('indexing.noindex', false)
            ->where('indexing.next', null));
    }

    public function test_category_page_is_indexable_with_a_clean_url_and_keeps_the_category_in_pagination(): void
    {
        $this->withLocale('fr');
        $this->fakeSanity(null, total: 30);

        $this->get('/blog/categorie/achat')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('blog/index')
            ->where('filter.active', 'achat')
            ->where('indexing.noindex', false)
            ->where('indexing.canonical', url('/blog/categorie/achat'))
            ->where('indexing.next', url('/blog/categorie/achat?page=2'))
            ->where('featured.url', url('/blog/dernier-article')) // the latest article of the locale, whatever the category
            // categories are not mapped between locales: the switcher / hreflang go to the other locale's blog index
            ->where('localization.alternates.en', url('/en/blog'))
            ->where('localization.alternates.fr', url('/blog/categorie/achat')));

        $this->get('/blog/categorie/achat?page=2')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('indexing.noindex', true)
            ->where('indexing.prev', url('/blog/categorie/achat')));

        Http::assertSent(fn (Request $r) => ($r->data()['$category'] ?? null) === '"achat"');
    }

    public function test_unknown_or_empty_category_and_pages_past_the_end_are_404(): void
    {
        $this->withLocale('fr');
        $this->fakeSanity(null, total: 1);

        $this->get('/blog/categorie/inconnue')->assertNotFound();
        $this->get('/blog/categorie/vide')->assertNotFound(); // exists in Sanity with 0 article
        $this->get('/blog/categorie/Achat%20OR%201')->assertNotFound();
        $this->get('/blog?page=2')->assertNotFound(); // 1 article = 1 page
        $this->get('/blog?category=achat')->assertOk()->assertInertia(fn (Assert $page) => $page->where('filter.active', null)); // the old query param is ignored
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
            ->where('post.seo_title', 'Acheter un appartement à Paris') // cut at the « : » break, keeping the keyword head
            ->where('post.seo_title_suffix', true)
            ->where('post.word_count', 12) // « Introduction » + « Premier paragraphe. » + 3 FAQ questions / answers
            ->where('post.body.0._type', 'wysiwygBlock')
            ->where('post.body.0.content.1.image.width', 1200)
            ->where('post.body.0.content.1.image.url', 'https://cdn.sanity.io/images/ks9vwq45/production/def456-1200x800.webp?w=1200&auto=format&fit=max')
            ->count('post.faqs', 3)
            ->where('post.tags', ['achat', 'paris'])
            ->where('related', []) // the listing fake only returns the current article, which is excluded
            ->where('alternates.fr', url('/blog/acheter-a-paris'))
            ->where('alternates.en', url('/en/blog/buying-in-paris'))
            ->where('alternates.x-default', url('/blog/acheter-a-paris'))
            // language switcher follows the translated slug, not the current one
            ->where('localization.alternates.en', url('/en/blog/buying-in-paris'))
            ->where('localization.alternates.fr', url('/blog/acheter-a-paris')));

        $this->assertLessThanOrEqual(60, mb_strlen('Acheter un appartement à Paris'.config('seo.title_separator').config('seo.site_name')));
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
        $pages = file_get_contents(public_path('sitemap.pages.xml'));
        $this->assertStringContainsString('<loc>'.url('/blog').'</loc>', $pages);
        $this->assertStringContainsString('<loc>'.url('/en/blog').'</loc>', $pages);
        $blog = file_get_contents(public_path('sitemap.blog.xml'));
        $this->assertStringContainsString('<loc>'.url('/blog/acheter-a-paris').'</loc>', $blog);
        $this->assertStringContainsString('hreflang="en" href="'.url('/en/blog/buying-in-paris').'"', $blog);
        $this->assertStringNotContainsString('<loc>'.url('/blog').'</loc>', $blog, 'the listing page belongs to the pages sitemap');
        $this->assertStringContainsString('<loc>'.url('/blog/categorie/achat').'</loc>', $blog, 'category pages are indexable');
        $this->assertStringContainsString('<loc>'.url('/en/blog/category/buying').'</loc>', $blog);

        $this->get('/llms.txt')->assertOk()->assertSee(url('/blog'))->assertSee(url('/en/blog'));
    }

    public function test_sitemap_survives_a_sanity_outage(): void
    {
        $this->withLocale('fr');
        Http::fake(fn () => Http::response('down', 503));

        $this->artisan('sitemap:generate')->assertSuccessful();
        $this->assertStringContainsString('<loc>'.url('/blog').'</loc>', file_get_contents(public_path('sitemap.pages.xml')));
        $this->assertStringContainsString('<loc>'.url('/sitemap.blog.xml').'</loc>', file_get_contents(public_path('sitemap.xml')));
    }
}
