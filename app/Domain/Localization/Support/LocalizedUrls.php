<?php

namespace App\Domain\Localization\Support;

use Mcamara\LaravelLocalization\Facades\LaravelLocalization;

/** Current page in every supported locale — feeds hreflang, the language switcher and og:locale:alternate. */
final class LocalizedUrls
{
    /** @var array<string, string>|null locale → URL, set by controllers whose translated page has a different slug (blog). */
    private ?array $override = null;

    /** @param array<string, string> $urlsByLocale */
    public function override(array $urlsByLocale): void
    {
        $this->override = $urlsByLocale;
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
            $url = $this->override[$code]
                ?? (LaravelLocalization::getLocalizedURL($code, null, [], false) ?: url($code === LaravelLocalization::getDefaultLocale() ? '/' : "/$code"));
            $alternates[$code] = $url;
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
