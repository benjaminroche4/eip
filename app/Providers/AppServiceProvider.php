<?php

namespace App\Providers;

use App\Domain\Blog\Support\SanityClient;
use App\Domain\Blog\Support\SanityImage;
use App\Domain\Localization\Support\LocalizedUrls;
use App\Http\Ssr\ResilientHttpGateway;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Inertia\Ssr\Gateway;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // SSR with short timeouts: an SSR server that is down degrades to client rendering instead of hanging every request.
        $this->app->bind(Gateway::class, ResilientHttpGateway::class);
        $this->app->singleton(LocalizedUrls::class);
        $this->app->singleton(SanityClient::class, fn () => new SanityClient(config('services.sanity')));
        $this->app->singleton(SanityImage::class, fn () => new SanityImage(config('services.sanity.project_id') ?? '', config('services.sanity.dataset')));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->isProduction()) {
            URL::forceScheme('https');
        }

        // <x-emails::layout> for the HTML e-mails (resources/views/mail/layout.blade.php).
        Blade::anonymousComponentPath(resource_path('views/mail'), 'emails');

        // Public contact form: 5 submissions per minute per IP.
        RateLimiter::for('contact', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
        RateLimiter::for('newsletter', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
        RateLimiter::for('estimate', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
    }
}
