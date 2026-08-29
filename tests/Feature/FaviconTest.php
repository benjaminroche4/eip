<?php

namespace Tests\Feature;

use Tests\TestCase;

/** Favicons + web manifest: every declared file exists with the right size, the manifest is valid and consistent with the brand. */
class FaviconTest extends TestCase
{
    /** @return array<string, array{int, int}> file → expected pixel size */
    private function icons(): array
    {
        return [
            'favicon-16x16.png' => [16, 16],
            'favicon-32x32.png' => [32, 32],
            'apple-touch-icon.png' => [180, 180],
            'android-chrome-192x192.png' => [192, 192],
            'android-chrome-512x512.png' => [512, 512],
            'android-chrome-maskable-192x192.png' => [192, 192],
            'android-chrome-maskable-512x512.png' => [512, 512],
        ];
    }

    public function test_every_icon_exists_with_the_expected_size(): void
    {
        foreach ($this->icons() as $file => [$w, $h]) {
            $path = public_path($file);
            $this->assertFileExists($path);
            $this->assertSame([$w, $h], array_slice((array) getimagesize($path), 0, 2), "$file must be {$w}×{$h}");
        }
        $this->assertGreaterThan(1000, filesize(public_path('favicon.ico')), 'favicon.ico must not be an empty placeholder');
        $this->assertStringContainsString('<svg', file_get_contents(public_path('favicon.svg')));
    }

    public function test_the_page_declares_the_icons_and_the_manifest(): void
    {
        $html = $this->get('/')->assertOk()->getContent();

        foreach (['/favicon.ico', '/favicon.svg', '/favicon-32x32.png', '/favicon-16x16.png', '/apple-touch-icon.png', '/site.webmanifest'] as $href) {
            $this->assertStringContainsString('href="'.$href.'"', $html, "missing <link> to $href");
        }
        $this->assertStringContainsString('<meta name="theme-color" content="'.config('seo.theme_color').'">', $html);
    }

    public function test_the_manifest_is_valid_and_points_to_existing_icons(): void
    {
        $manifest = json_decode(file_get_contents(public_path('site.webmanifest')), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame(config('seo.site_name'), $manifest['name']);
        $this->assertSame(config('seo.theme_color'), $manifest['theme_color']);
        $this->assertSame('/', $manifest['start_url']);
        $purposes = [];
        foreach ($manifest['icons'] as $icon) {
            $this->assertFileExists(public_path($icon['src']));
            $this->assertSame([$icon['sizes']], [implode('x', array_slice((array) getimagesize(public_path($icon['src'])), 0, 2))]);
            $purposes[] = $icon['purpose'];
        }
        $this->assertContains('maskable', $purposes, 'Android needs a maskable icon (safe zone padding)');
    }
}
