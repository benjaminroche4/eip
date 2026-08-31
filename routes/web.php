<?php

use App\Http\Controllers\BlogController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\EstimateController;
use App\Http\Controllers\FaqController;
use App\Http\Controllers\LegalController;
use App\Http\Controllers\NewsletterController;
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
    Route::get(LaravelLocalization::transRoute('routes.blog'), [BlogController::class, 'index'])->name('blog.index');
    Route::get(LaravelLocalization::transRoute('routes.blog_show'), [BlogController::class, 'show'])->name('blog.show');

    // Service pages (content to come): one Inertia page per route, SEO slugs in lang/{locale}/routes.php.
    Route::get(LaravelLocalization::transRoute('routes.contact'), [ContactController::class, 'show'])->name('contact');
    Route::post(LaravelLocalization::transRoute('routes.contact'), [ContactController::class, 'store'])->middleware('throttle:contact')->name('contact.store');

    Route::get(LaravelLocalization::transRoute('routes.newsletter'), [NewsletterController::class, 'show'])->name('newsletter');
    Route::post(LaravelLocalization::transRoute('routes.newsletter'), [NewsletterController::class, 'store'])->middleware('throttle:newsletter')->name('newsletter.store');

    Route::get(LaravelLocalization::transRoute('routes.faq'), FaqController::class)->name('faq');

    Route::get(LaravelLocalization::transRoute('routes.estimate'), [EstimateController::class, 'show'])->name('estimate');
    Route::post(LaravelLocalization::transRoute('routes.estimate'), [EstimateController::class, 'store'])->middleware('throttle:estimate')->name('estimate.store');

    foreach (['sell', 'buy'] as $key) {
        Route::get(LaravelLocalization::transRoute("routes.$key"), fn () => Inertia::render($key))->name($key);
    }

    foreach (['privacy', 'legal', 'terms'] as $key) {
        Route::get(LaravelLocalization::transRoute("routes.$key"), fn () => app(LegalController::class)($key))->name($key);
    }
});

// Local-only preview of the error pages: in dev APP_DEBUG shows the debug screen instead of the
// Inertia error page (bootstrap/app.php), so real 403/500 cannot be triggered to check the design.
if (app()->environment('local')) {
    Route::get('dev/error/{status}', fn (string $status) => Inertia::render('error', ['status' => (int) $status])
        ->toResponse(request())
        ->setStatusCode((int) $status))->whereIn('status', ['403', '404', '500', '503']);
}

Route::get('robots.txt', [SeoController::class, 'robots'])->name('robots');
Route::get('llms.txt', [SeoController::class, 'llms'])->name('llms');

Route::middleware(['auth', 'no-ssr'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
