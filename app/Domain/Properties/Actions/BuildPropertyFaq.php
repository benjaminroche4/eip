<?php

namespace App\Domain\Properties\Actions;

use App\Domain\Content\Actions\ListArrondissements;
use App\Domain\Content\Support\LocaleNumber;
use App\Domain\Properties\Data\Property;
use App\Domain\Properties\Support\DistrictSlug;
use Illuminate\Support\Str;

/**
 * The FAQ that closes a listing's page (user decision 2026-10-14: « the questions a buyer asks most about the process
 * and the agency, as relevant as possible »): six questions whose answers are written from the listing and the agency's
 * facts (never the advisor's name, user decision 2026-10-14) (fees, average price of the arrondissement, phone, hours), in `ui.property.faq.items`. Rentals get
 * their own wording for the viewing, the file and the fees; a sold listing says so. Same shape as the FAQ teasers of
 * the service pages (`FaqExcerpt`), the page emits the matching FAQPage JSON-LD.
 */
final class BuildPropertyFaq
{
    /** Question keys in page order; `_rent` variants replace the sale ones for a rental. */
    public const QUESTIONS = ['visit', 'offer', 'fees', 'negotiate', 'documents', 'contact'];

    public function __construct(private ListArrondissements $arrondissements) {}

    /** @return array{slug: string, items: list<array{question: string, answer: string, slug: string}>} */
    public function __invoke(Property $property, ?string $locale = null): array
    {
        $locale ??= app()->getLocale();
        $rent = $property->transaction === 'rent';
        $values = $this->values($property, $locale);

        $items = [];
        foreach (self::QUESTIONS as $key) {
            $variant = match (true) {
                $key === 'visit' && $property->isSold() => 'visit_sold',
                $rent && in_array($key, ['offer', 'fees', 'negotiate', 'documents'], true) => "{$key}_rent",
                $key === 'fees' && ($property->fees['paid_by'] ?? null) === 'buyer' && ($property->fees['amount'] ?? 0) > 0 => 'fees_buyer',
                $key === 'negotiate' && ($property->priceOnRequest || $values['district_price'] === '' || $values['price_sqm'] === '') => 'negotiate_on_request',
                default => $key,
            };
            $question = __("ui.property.faq.items.$variant.question", $values, $locale);
            $items[] = ['question' => $question, 'answer' => __("ui.property.faq.items.$variant.answer", $values, $locale), 'slug' => Str::slug($question)];
        }

        return ['slug' => $rent ? 'agency' : 'buying', 'items' => $items];
    }

    /** @return array<string, string> */
    private function values(Property $property, string $locale): array
    {
        $arrondissement = collect(($this->arrondissements)($locale))->firstWhere('n', $property->arrondissement);
        $format = fn (int $amount) => __('ui.districts.price_format', ['price' => LocaleNumber::integer($amount, $locale)], $locale);

        return [
            'district' => 'Paris '.DistrictSlug::ordinal($property->arrondissement, $locale),
            // `Arrondissement::$price` is already formatted (« 13 000 »): Notaires du Grand Paris, last published quarter
            'district_price' => ($arrondissement?->price ?? '') !== '' ? __('ui.districts.price_format', ['price' => $arrondissement->price], $locale) : '',
            'price_sqm' => $property->priceOnRequest || $property->surface <= 0 || $property->price <= 0 ? '' : $format($property->pricePerSqm()),
            'fees_amount' => isset($property->fees['amount']) ? $format((int) $property->fees['amount']) : '',
            'phone' => (string) config('seo.organization.phone'),
            'email' => (string) config('seo.organization.email'),
            'address' => trim(implode(', ', array_filter([config('seo.organization.address.street'), trim(config('seo.organization.address.postal_code').' '.config('seo.organization.address.city'))]))),
            'hours' => (string) config('seo.hours.labels.'.$locale, config('seo.hours.labels.fr')),
        ];
    }
}
