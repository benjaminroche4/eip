<?php

namespace App\Domain\Properties\Support;

use App\Domain\Properties\Data\Property;
use Mcamara\LaravelLocalization\Facades\LaravelLocalization;

/**
 * Detail URL of a listing (SEO decisions 2026-09-28 / 2026-09-29): the transaction, then the arrondissement's listing
 * page, then the slug — `/nos-biens/achat/paris-6e/appartement-saint-germain-des-pres` ↔
 * `/en/properties/buy/paris-6th/apartment-saint-germain-des-pres`, `location` / `rent` for rentals. The hierarchy
 * mirrors the breadcrumb and puts the intent (buy / rent), the city and the arrondissement keywords in the path, so
 * the slug itself no longer repeats them.
 */
final class PropertyUrl
{
    /** The translated transaction segment (`routes.transaction_sale` / `routes.transaction_rent`). */
    public static function transactionSegment(string $transaction, string $locale): string
    {
        return __($transaction === 'rent' ? 'routes.transaction_rent' : 'routes.transaction_sale', [], $locale);
    }

    /** The transaction a URL segment stands for, in any language, or null. */
    public static function transactionOf(string $segment): ?string
    {
        foreach (array_keys(LaravelLocalization::getSupportedLocales()) as $locale) {
            foreach (['sale', 'rent'] as $transaction) {
                if ($segment === self::transactionSegment($transaction, $locale)) {
                    return $transaction;
                }
            }
        }

        return null;
    }

    public static function make(string $transaction, int $arrondissement, string $slug, string $locale): string
    {
        return LaravelLocalization::getURLFromRouteNameTranslated($locale, 'routes.properties')
            .'/'.self::transactionSegment($transaction, $locale)
            .'/'.DistrictSlug::make($arrondissement, $locale)
            .'/'.$slug;
    }

    public static function of(Property $property, string $locale): string
    {
        return self::make($property->transaction, $property->arrondissement, $property->slug, $locale);
    }
}
