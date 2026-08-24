<?php

use App\Http\Controllers\LegalController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\SeoController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Mcamara\LaravelLocalization\Facades\LaravelLocalization;

/*
|--------------------------------------------------------------------------
| Public, localized routes — /fr/... and /en/... (slugs in lang/{locale}/routes.php)
|--------------------------------------------------------------------------
| French (default) lives at the root, English under /en. The URL is the only source of truth:
| no cookie/session/Accept-Language redirects (they would bounce "/" back to "/en" after a
| visitor picked English, and mislead crawlers). Auth & settings stay unprefixed.
*/
Route::group([
    'prefix' => LaravelLocalization::setLocale(),
    'middleware' => ['localize', 'localizationRedirect'],
], function () {
    Route::get('/', fn () => Inertia::render('home'))->name('home');
    Route::get(LaravelLocalization::transRoute('routes.search'), SearchController::class)->name('search');

    foreach (['privacy', 'legal', 'terms'] as $key) {
        Route::get(LaravelLocalization::transRoute("routes.$key"), fn () => app(LegalController::class)($key))->name($key);
    }
});

Route::get('robots.txt', [SeoController::class, 'robots'])->name('robots');
Route::get('llms.txt', [SeoController::class, 'llms'])->name('llms');

Route::middleware(['auth', 'no-ssr'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
