<?php

namespace Tests\Feature;

use App\Domain\Localization\Support\SharedTranslations;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * The `translations` prop is trimmed per route: this scans every page's imports for `t('section.…')` calls and
 * checks each section is shared on that route, so a component reading a section its page does not receive fails
 * here instead of rendering raw keys in production.
 */
class SharedTranslationsTest extends TestCase
{
    /** Route family → Inertia page file (the layout and its header / footer are reached through the page's imports). */
    private const PAGES = [
        'home' => 'pages/home.tsx',
        'buy' => 'pages/buy.tsx',
        'sell' => 'pages/sell.tsx',
        'estimate' => 'pages/estimate.tsx',
        'contact' => 'pages/contact.tsx',
        'newsletter' => 'pages/newsletter.tsx',
        'about' => 'pages/about.tsx',
        'faq' => 'pages/faq.tsx',
        'blog' => ['pages/blog/index.tsx', 'pages/blog/show.tsx'],
        'search' => 'pages/search.tsx',
        'privacy' => 'pages/legal.tsx',
        'legal' => 'pages/legal.tsx',
        'sitemap' => 'pages/sitemap.tsx',
        null => 'pages/error.tsx',
    ];

    public function test_every_page_receives_the_translation_sections_its_components_read(): void
    {
        foreach (self::PAGES as $family => $files) {
            $family = $family === '' ? null : $family;
            $shared = SharedTranslations::sectionsFor($family === null ? null : "$family.any");
            foreach ((array) $files as $file) {
                $used = $this->sectionsReadBy(resource_path("js/$file"));
                $missing = array_diff($used, $shared);
                $this->assertSame([], array_values($missing), "$file reads translation sections not shared on route family '$family' (add them to SharedTranslations::ROUTES)");
            }
        }
    }

    public function test_pages_do_not_carry_the_other_pages_strings(): void
    {
        $this->get('/questions-frequentes')->assertInertia(function (Assert $page) {
            $sections = array_keys($page->toArray()['props']['translations']);
            $this->assertContains('faq', $sections);
            $this->assertContains('nav', $sections);
            foreach (['estimate', 'mail', 'blog', 'testimonials', 'about'] as $other) {
                $this->assertNotContains($other, $sections, "the FAQ page must not embed the '$other' strings");
            }
        });

        $this->assertNotContains('mail', SharedTranslations::sectionsFor('contact'), 'e-mail strings are server-side only');
        $this->assertSame(SharedTranslations::ALWAYS, SharedTranslations::sectionsFor(null)); // error pages: layout strings only
        $this->assertContains('blog', SharedTranslations::sectionsFor('blog.category'));
    }

    public function test_content_arrays_passed_as_props_are_not_duplicated_in_the_strings(): void
    {
        $sources = $this->allSources();
        foreach (SharedTranslations::EXCLUDE as $path) {
            $this->assertDoesNotMatchRegularExpression('/\\btc?\\(\\s*[`\'"]'.preg_quote($path, '/').'[.`\'"]/', $sources, "$path is stripped from the shared strings: read it from the page props, not through t()");
        }
        $this->get('/questions-frequentes')->assertInertia(fn (Assert $page) => $page->missing('translations.faq.categories')->has('categories'));
    }

    public function test_every_static_translation_key_exists_in_both_languages(): void
    {
        preg_match_all('/\\btc?\\(\\s*[\'"]([a-z0-9_]+(?:\\.[a-z0-9_]+)+)[\'"]/', $this->allSources(), $m);
        $keys = array_unique($m[1]);
        $this->assertNotEmpty($keys);
        foreach (['fr', 'en'] as $locale) {
            $strings = trans('ui', [], $locale);
            $missing = array_values(array_filter($keys, fn (string $key) => ! is_string(data_get($strings, $key))));
            $this->assertSame([], $missing, "t() keys missing from lang/$locale/ui.php (raw keys would show on the page)");
        }
    }

    /** Every TS/TSX source under resources/js, concatenated (the translation hook's doc comment excluded). */
    private function allSources(): string
    {
        $out = '';
        foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator(resource_path('js'))) as $file) {
            if ($file->isFile() && preg_match('/\\.tsx?$/', $file->getFilename()) && ! str_ends_with($file->getPathname(), 'hooks/use-translation.ts')) {
                $out .= file_get_contents($file->getPathname())."\n";
            }
        }

        return $out;
    }

    /**
     * First segments of every `t('x.…')` / `tc('x.…')` / t(`x.…`) key in the file and, recursively, in the project
     * files it imports (`@/…` and relative), the translation hook's own doc comment excluded.
     *
     * @param  array<string, true>  $seen
     * @return list<string>
     */
    private function sectionsReadBy(string $file, array &$seen = []): array
    {
        $file = realpath($file) ?: $file;
        if (isset($seen[$file]) || ! is_file($file) || str_ends_with($file, 'hooks/use-translation.ts')) {
            return [];
        }
        $seen[$file] = true;
        $source = (string) file_get_contents($file);

        preg_match_all('/\btc?\(\s*[`\'"]([a-z0-9_]+)\./', $source, $keys);
        $sections = $keys[1];

        preg_match_all('/from\s+[\'"](@\/[^\'"]+|\.{1,2}\/[^\'"]+)[\'"]/', $source, $imports);
        foreach ($imports[1] as $import) {
            $base = str_starts_with($import, '@/') ? resource_path('js/'.substr($import, 2)) : dirname($file).'/'.$import;
            foreach (['', '.tsx', '.ts', '/index.tsx', '/index.ts'] as $ext) {
                if (is_file($base.$ext)) {
                    $sections = [...$sections, ...$this->sectionsReadBy($base.$ext, $seen)];
                    break;
                }
            }
        }

        return array_values(array_unique($sections));
    }
}
