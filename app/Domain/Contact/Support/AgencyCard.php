<?php

namespace App\Domain\Contact\Support;

use Mcamara\LaravelLocalization\Facades\LaravelLocalization;

/** Everything the e-mails need to present the agency consistently (same values as the site: config/seo.php). */
final class AgencyCard
{
    /** @return array<string, mixed> */
    public static function for(string $locale): array
    {
        $org = config('seo.organization');
        $address = array_filter($org['address'] ?? []);
        $line = trim(($address['street'] ?? '').', '.trim(($address['postal_code'] ?? '').' '.($address['city'] ?? '')), ', ');
        $phone = $org['phone'] ?? null;

        return [
            'name' => config('seo.site_name'),
            'siteUrl' => rtrim((string) config('app.url'), '/'),
            'contactUrl' => LaravelLocalization::getURLFromRouteNameTranslated($locale, 'routes.contact'),
            'logoUrl' => url('/images/email/logo-dark.png'), // PNG: SVG logos are not rendered by Gmail/Outlook
            'email' => $org['email'] ?? null,
            'phone' => $phone,
            'phoneHref' => $phone ? 'tel:'.preg_replace('/\s+/', '', $phone) : null,
            'whatsappUrl' => ($org['whatsapp'] ?? null) ? 'https://wa.me/'.$org['whatsapp'] : null,
            'addressLine' => $line !== '' ? $line.(($address['country'] ?? 'FR') === 'FR' ? ', France' : '') : null,
            'mapsUrl' => $line !== '' ? 'https://www.google.com/maps/search/?api=1&query='.urlencode($line) : null,
            'hours' => config('seo.hours.labels.'.$locale, config('seo.hours.labels.fr')),
            'advisor' => config('seo.advisor.name') ? [
                'name' => config('seo.advisor.name'),
                'role' => config('seo.advisor.role.'.$locale) ?: config('seo.advisor.role.fr'),
                'photoUrl' => url('/images/email/advisor.png'), // PNG copy of seo.advisor.photo (webp unsupported in Outlook)
            ] : null,
            'social' => array_filter(config('seo.social')),
        ];
    }
}
