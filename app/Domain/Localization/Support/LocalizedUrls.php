<?php

namespace App\Domain\Localization\Support;

use Mcamara\LaravelLocalization\Facades\LaravelLocalization;

/** Current page in every supported locale — feeds hreflang, the language switcher and og:locale:alternate. */
final class LocalizedUrls
{
    /** @return array<string, mixed> */
    public function forCurrentRequest(): array
    {
        $current = LaravelLocalization::getCurrentLocale();
        $supported = LaravelLocalization::getSupportedLocales();
        $alternates = [];
        $locales = [];

        foreach ($supported as $code => $meta) {
            $url = LaravelLocalization::getLocalizedURL($code, null, [], true) ?: url("/$code");
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
