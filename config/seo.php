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
        'spec' => env('SEO_OPENING_HOURS', 'Mo-Sa 09:00-19:00'),
        'labels' => [
            'fr' => env('SEO_OPENING_HOURS_FR', 'Lun – Sam, 9h – 19h'),
            'en' => env('SEO_OPENING_HOURS_EN', 'Mon – Sat, 9am – 7pm'),
        ],
    ],

    // Advisor shown in the footer contact card (photo 320×320 recommended, in public/images).
    'agent' => [
        'name' => env('SEO_AGENT_NAME', 'Votre conseiller'),
        'role' => env('SEO_AGENT_ROLE'),
        'photo' => env('SEO_AGENT_PHOTO', '/images/agent-placeholder.png'),
    ],

    // Google reviews trust badge (footer) + AggregateRating in JSON-LD.
    // Only set real, verifiable numbers: Google penalises fabricated ratings.
    'reviews' => [
        'rating' => env('SEO_GOOGLE_RATING') !== null ? (float) env('SEO_GOOGLE_RATING') : null,
        'count' => env('SEO_GOOGLE_REVIEW_COUNT') !== null ? (int) env('SEO_GOOGLE_REVIEW_COUNT') : null,
        'url' => env('SEO_GOOGLE_REVIEWS_URL'),
    ],

    // Social profiles shown in the footer (leave empty to hide). Also merged into Organization.sameAs.
    'social' => [
        'linkedin' => env('SEO_SOCIAL_LINKEDIN'),
        'threads' => env('SEO_SOCIAL_THREADS'),
        'facebook' => env('SEO_SOCIAL_FACEBOOK'),
    ],

    // GEO (Generative Engine Optimization): short, factual summary served in /llms.txt
    'llms' => [
        'summary' => env('SEO_LLMS_SUMMARY', 'Décrivez ici votre produit/service en 2-3 phrases factuelles : ce que vous faites, pour qui, où.'),
        'contact' => env('SEO_ORG_EMAIL'),
    ],
];
