<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'sanity' => [
        'project_id' => env('SANITY_PROJECT_ID'),
        'dataset' => env('SANITY_DATASET', 'production'),
        'api_version' => env('SANITY_API_VERSION', '2025-02-09'),
        'token' => env('SANITY_TOKEN'),
        'use_cdn' => (bool) env('SANITY_USE_CDN', false),
        // Document type of the articles: the Sanity project is shared with Relocation in Paris (`blog`); this site reads `estateBlog`.
        'blog_type' => env('SANITY_BLOG_TYPE', 'estateBlog'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Google Tag Manager container (GTM-XXXXXXX). Empty = no tag injected (local, tests).
    'gtm' => [
        'id' => env('GTM_ID'),
    ],

];
