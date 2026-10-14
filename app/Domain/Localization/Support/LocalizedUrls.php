<?php

namespace App\Domain\Localization\Support;

use Mcamara\LaravelLocalization\Facades\LaravelLocalization;

/** Current page in every supported locale — feeds hreflang, the language switcher and og:locale:alternate. */
final class LocalizedUrls
{
    /** @var array<string, string>|null locale → URL, set by controllers whose translated page has a different slug (blog). */
    private ?array $override = null;

    /** @var array<string, string>|null locale → fallback URL of the switcher for a locale without a twin page (listing index), never an hreflang */
    private ?array $fallback = null;

    /**
     * @param  array<string, string>  $urlsByLocale  the twin page in each locale that has one (hreflang + switcher)
     * @param  array<string, string>|null  $fallbackByLocale  where the switcher goes for a locale without a twin; such a locale gets no hreflang (2026-10-14)
     */
    public function override(array $urlsByLocale, ?array $fallbackByLocale = null): void
    {
        $this->override = $urlsByLocale;
        $this->fallback = $fallbackByLocale;
    }

    /** @return array<string, mixed> */
    public function forCurrentRequest(): array
    {
        $current = LaravelLocalization::getCurrentLocale();
        $supported = LaravelLocalization::getSupportedLocales();
        $alternates = [];
        $locales = [];

        foreach ($supported as $code => $meta) {
            // forceDefaultLocation=false: the default locale stays hidden from its URLs (hideDefaultLocaleInURL)
            $twin = $this->override[$code]
                ?? ($this->fallback === null ? (LaravelLocalization::getLocalizedURL($code, null, [], false) ?: url($code === LaravelLocalization::getDefaultLocale() ? '/' : "/$code")) : null);
            $url = $twin ?? $this->fallback[$code] ?? url('/');
            if ($twin !== null) {
                $alternates[$code] = $twin;
            }
            $locales[] = [
                'code' => $code,
                'native' => $meta['native'],
                'regional' => $meta['regional'],
                'url' => $url,
                'current' => $code === $current,
            ];
        }

        $alternates['x-default'] = $alternates[LaravelLocalization::getDefaultLocale()] ?? $alternates[$current];

        return [
            'current' => $current,
            'default' => LaravelLocalization::getDefaultLocale(),
            'regional' => $supported[$current]['regional'] ?? 'fr_FR',
            'locales' => $locales,
            'alternates' => $alternates,
        ];
    }
}
