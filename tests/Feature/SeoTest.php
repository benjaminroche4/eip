<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SeoTest extends TestCase
{
    use RefreshDatabase;

    public function test_robots_txt_is_served_dynamically_with_the_sitemap_url(): void
    {
        $this->get('/robots.txt')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
            ->assertSee('Sitemap: '.url('/sitemap.xml'))
            ->assertSee('Disallow: /dashboard')
            ->assertSee('User-agent: GPTBot');
    }

    public function test_llms_txt_is_served_for_ai_crawlers(): void
    {
        $this->get('/llms.txt')
            ->assertOk()
            ->assertSee('# '.config('seo.site_name'))
            ->assertSee('/recherche')
            ->assertSee('/en/search')
            ->assertSee('## Contact')
            ->assertDontSee('Décrivez ici');
    }

    public function test_search_page_is_indexable_only_on_its_unfiltered_first_page(): void
    {
        $this->withLocale('fr')->get('/recherche')->assertOk()->assertInertia(fn (Assert $page) => $page->component('search')->where('indexing.noindex', false));
        $this->get('/recherche?q=1')->assertOk()->assertInertia(fn (Assert $page) => $page->where('indexing.noindex', true));
        $this->get('/recherche?page=2')->assertOk()->assertInertia(
            fn (Assert $page) => $page->where('indexing.noindex', true)->where('indexing.prev', url('/recherche'))
        );
    }

    public function test_shared_seo_props_are_available_to_every_page(): void
    {
        $this->withLocale('fr')->get('/')->assertInertia(fn (Assert $page) => $page->has('seo.siteName')->has('seo.image')->has('ziggy.location'));
    }

    public function test_unknown_pages_render_the_inertia_error_page_with_a_404_status(): void
    {
        config(['app.debug' => false]);
        $this->get('/cette-page-n-existe-pas')->assertNotFound()->assertInertia(fn (Assert $page) => $page->component('error')->where('status', 404));
    }

    public function test_sitemap_command_writes_an_index_and_one_sitemap_per_content_family(): void
    {
        $this->artisan('sitemap:generate')->assertSuccessful();

        $index = file_get_contents(public_path('sitemap.xml'));
        $this->assertStringContainsString('<sitemapindex', $index);
        foreach (['sitemap.pages.xml', 'sitemap.blog.xml'] as $file) {
            $this->assertStringContainsString('<loc>'.url('/'.$file).'</loc>', $index);
            $this->assertFileExists(public_path($file));
        }
        $this->assertMatchesRegularExpression('/<lastmod>\d{4}-\d{2}-\d{2}T/', $index);
        $this->assertStringNotContainsString('<url>', $index, 'the index only lists sitemaps');

        $pages = file_get_contents(public_path('sitemap.pages.xml'));
        $this->assertStringContainsString('<loc>'.url('/recherche').'</loc>', $pages);
        $this->assertStringContainsString('<loc>'.url('/en/search').'</loc>', $pages);
        $this->assertStringContainsString('hreflang="x-default"', $pages);
        $this->assertStringNotContainsString('<loc>'.url('/blog').'/', $pages, 'articles live in the blog sitemap'); // url() trims the trailing slash
    }
}
