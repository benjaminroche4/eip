<?php

/*
|--------------------------------------------------------------------------
| Site-wide SEO / GEO defaults
|--------------------------------------------------------------------------
| Shared with the front-end through HandleInertiaRequests (`seo` prop) and
| used by the <Seo/> component, JSON-LD builders, sitemap and llms.txt.
*/

return [
    'site_name' => env('SEO_SITE_NAME', env('APP_NAME', 'Laravel')),
    'title_separator' => ' · ',
    'default_description' => env('SEO_DESCRIPTION', 'Application Laravel + Inertia + React : rapide, accessible et optimisée pour le référencement.'),
    'default_image' => env('SEO_DEFAULT_IMAGE', '/og-default.png'), // 1200×630, absolute or relative to APP_URL
    'locale' => 'fr_FR',
    'language' => 'fr',
    'twitter' => env('SEO_TWITTER', null), // '@handle'
    'theme_color' => '#202832',

    'organization' => [
        'name' => env('SEO_ORG_NAME', env('APP_NAME', 'Laravel')),
        'legal_name' => env('SEO_ORG_LEGAL_NAME'),
        'logo' => '/brand/logo_dark_desktop.svg',
        'email' => env('SEO_ORG_EMAIL'),
        'phone' => env('SEO_ORG_PHONE'),
        'whatsapp' => env('SEO_ORG_WHATSAPP'), // international number without spaces (e.g. 33659253695) — empty = link hidden
        'same_as' => array_values(array_filter(explode(',', (string) env('SEO_ORG_SAME_AS', '')))), // social/profile URLs
        'address' => [
            'street' => env('SEO_ORG_STREET'),
            'city' => env('SEO_ORG_CITY'),
            'postal_code' => env('SEO_ORG_POSTAL_CODE'),
            'country' => env('SEO_ORG_COUNTRY', 'FR'),
        ],
    ],

    // Opening hours: schema.org spec + human labels per locale (footer + JSON-LD RealEstateAgent.openingHours)
    'hours' => [
        'spec' => env('SEO_OPENING_HOURS', 'Mo-Fr 08:00-20:00, Sa 08:00-12:00'),
        'labels' => [
            'fr' => env('SEO_OPENING_HOURS_FR', 'Lun - Ven, 8h - 20h · Sam, 8h - 12h'),
            'en' => env('SEO_OPENING_HOURS_EN', 'Mon - Fri, 8am - 8pm · Sat, 8am - 12pm'),
        ],
    ],

    // Google reviews trust badge (footer) + AggregateRating in JSON-LD.
    // Only set real, verifiable numbers: Google penalises fabricated ratings.
    'reviews' => [
        'rating' => env('SEO_GOOGLE_RATING') !== null ? (float) env('SEO_GOOGLE_RATING') : null,
        'count' => env('SEO_GOOGLE_REVIEW_COUNT') !== null ? (int) env('SEO_GOOGLE_REVIEW_COUNT') : null,
        'url' => env('SEO_GOOGLE_REVIEWS_URL'),
    ],

    // Advisor featured on the contact confirmation (name empty = card hidden). Photo in public/images/advisors.
    'advisor' => [
        'name' => env('SEO_ADVISOR_NAME'),
        'role' => ['fr' => env('SEO_ADVISOR_ROLE_FR'), 'en' => env('SEO_ADVISOR_ROLE_EN')],
        'photo' => env('SEO_ADVISOR_PHOTO', '/images/advisors/advisor-1.webp'),
        'experience_years' => env('SEO_ADVISOR_EXPERIENCE_YEARS') !== null ? (int) env('SEO_ADVISOR_EXPERIENCE_YEARS') : null,
    ],

    // Social profiles shown in the footer (leave empty to hide). Also merged into Organization.sameAs.
    'social' => [
        'linkedin' => env('SEO_SOCIAL_LINKEDIN'),
        'instagram' => env('SEO_SOCIAL_INSTAGRAM'),
    ],

    // GEO (Generative Engine Optimization): short, factual summary served in /llms.txt
    'llms' => [
        'summary' => env('SEO_LLMS_SUMMARY', 'Estate in Paris est une agence immobilière de prestige basée à Paris (75003). Elle sélectionne et vend des appartements, hôtels particuliers et biens off-market à Paris pour une clientèle française et internationale, avec un conseiller dédié. Site bilingue français / anglais.'),
        'summary_en' => env('SEO_LLMS_SUMMARY_EN', 'Estate in Paris is a luxury real estate agency based in Paris (75003). It selects and sells apartments, private mansions and off-market properties in Paris for French and international clients, with a dedicated advisor. Bilingual French / English website.'),
        'contact' => env('SEO_ORG_EMAIL'),
    ],
];
