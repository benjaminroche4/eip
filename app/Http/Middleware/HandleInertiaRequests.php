<?php

namespace App\Http\Middleware;

use App\Domain\Localization\Support\LocalizedUrls;
use App\Domain\Seo\Support\OpeningHours;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return array_merge(parent::share($request), [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
            ],
            'locale' => app()->getLocale(),
            'year' => now()->year,
            'flash' => fn () => [
                'success' => $request->session()->get('success'),
                'callbackPhone' => $request->session()->get('callback_phone'),
                'newsletter' => $request->session()->get('newsletter_success'),
                'valuationReference' => $request->session()->get('valuation_reference'),
            ],
            'localization' => fn () => app(LocalizedUrls::class)->forCurrentRequest(),
            'translations' => fn () => trans('ui'),
            'seo' => fn () => [
                'siteName' => config('seo.site_name'),
                'separator' => config('seo.title_separator'),
                'description' => config('seo.default_description'),
                'image' => url(config('seo.default_image')),
                'locale' => config('laravellocalization.supportedLocales.'.app()->getLocale().'.regional', config('seo.locale')),
                'twitter' => config('seo.twitter'),
                'organization' => [
                    'name' => config('seo.organization.name'),
                    'logo' => url(config('seo.organization.logo')),
                    'sameAs' => array_values(array_unique(array_filter([...config('seo.organization.same_as'), ...array_values(config('seo.social'))]))),
                    'email' => config('seo.organization.email'),
                    'phone' => config('seo.organization.phone'),
                    'whatsapp' => config('seo.organization.whatsapp'),
                    'address' => array_filter(config('seo.organization.address')),
                ],
                'social' => array_filter(config('seo.social')),
                'advisor' => config('seo.advisor.name') ? [
                    'name' => config('seo.advisor.name'),
                    'role' => config('seo.advisor.role.'.app()->getLocale()) ?: config('seo.advisor.role.fr'),
                    'photo' => config('seo.advisor.photo'),
                    'experienceYears' => config('seo.advisor.experience_years'),
                ] : null,
                'hours' => [
                    'spec' => config('seo.hours.spec'),
                    'label' => config('seo.hours.labels.'.app()->getLocale(), config('seo.hours.labels.fr')),
                    'open' => (new OpeningHours((string) config('seo.hours.spec')))->isOpen(),
                ],
                'reviews' => config('seo.reviews.rating') && config('seo.reviews.count') ? config('seo.reviews') : null,
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ]);
    }
}
