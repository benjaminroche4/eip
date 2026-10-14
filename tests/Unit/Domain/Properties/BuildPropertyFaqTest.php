<?php

namespace Tests\Unit\Domain\Properties;

use App\Domain\Properties\Actions\BuildPropertyFaq;
use App\Domain\Properties\Data\Property;
use Tests\TestCase;

/** The FAQ closing a listing's page: process and agency questions answered from the listing's data (user decision 2026-10-14). */
class BuildPropertyFaqTest extends TestCase
{
    /** @param array<string, mixed> $over */
    private function faq(array $over = [], string $slug = 'appartement-champ-de-mars', string $locale = 'fr'): array
    {
        config(['seo.organization.phone' => '+33 1 88 83 73 30', 'seo.organization.email' => 'contact@estate-in-paris.fr', 'seo.organization.address.street' => '3 rue Grégoire de Tours', 'seo.organization.address.postal_code' => '75006', 'seo.organization.address.city' => 'Paris']);
        $row = collect(self::sampleProperties($locale))->firstWhere('slug', $slug);

        return app(BuildPropertyFaq::class)(Property::fromArray(array_merge($row, $over)), $locale);
    }

    public function test_a_sale_gets_six_questions_answered_from_the_listing_and_the_agency(): void
    {
        $faq = $this->faq();
        $this->assertSame('buying', $faq['slug']);
        $this->assertSame(['Puis-je visiter ce bien ?', "Comment faire une offre d'achat ?", 'Quels sont les honoraires et qui les paie ?', 'Le prix est-il négociable ?', 'Faut-il un financement validé avant de visiter ?', "Comment contacter l'agence ?"], array_column($faq['items'], 'question'));
        $this->assertSame('puis-je-visiter-ce-bien', $faq['items'][0]['slug']);
        $this->assertStringNotContainsString('Charles', json_encode($faq, JSON_UNESCAPED_UNICODE), 'never the advisor\'s name (user decision 2026-10-14)');
        $this->assertStringContainsString('6 % TTC du prix de vente, à la charge du vendeur', $faq['items'][2]['answer']);
        $this->assertStringContainsString('19 091 € le m², contre 13 000 € en moyenne dans le Paris 7e', $faq['items'][3]['answer']); // 3 150 000 / 165 (narrow no-break space, as every price) against the Notaires' figure
        $this->assertStringContainsString('+33 1 88 83 73 30', $faq['items'][5]['answer']);
        $this->assertStringContainsString('3 rue Grégoire de Tours, 75006 Paris', $faq['items'][5]['answer']);
        $this->assertStringContainsString('[page contact](contact)', $faq['items'][5]['answer']); // the FAQ link markup, rendered by the block
        foreach ($faq['items'] as $item) {
            $this->assertStringNotContainsString(':', preg_replace('/\b\d{1,2}h\b|\d{1,2}:\d{2}|: /', '', $item['answer']), 'every placeholder resolved: '.$item['answer']);
        }
    }

    public function test_price_on_request_buyer_fees_sold_and_rental_listings_get_their_own_answers(): void
    {
        $onRequest = $this->faq(['price_on_request' => true]);
        $this->assertStringNotContainsString('19 091', $onRequest['items'][3]['answer']);
        $this->assertStringNotContainsString('3 150 000', json_encode($onRequest, JSON_UNESCAPED_UNICODE), 'a hidden price never shows up');

        $buyer = $this->faq(['fees' => ['paid_by' => 'buyer', 'amount' => 20000]]);
        $this->assertStringContainsString("20 000 € TTC, à la charge de l'acquéreur", $buyer['items'][2]['answer']);

        $sold = $this->faq([], 'appartement-luxembourg');
        $this->assertSame('Ce bien est-il encore disponible ?', $sold['items'][0]['question']);

        $rent = $this->faq([], 'location-appartement-meuble-marais');
        $this->assertSame('agency', $rent['slug']);
        $this->assertSame(['Puis-je visiter ce bien ?', 'Comment déposer un dossier de location ?', 'Quels sont les honoraires de location ?', 'Le loyer est-il négociable ?', 'Quelles sont les conditions pour louer ?', "Comment contacter l'agence ?"], array_column($rent['items'], 'question'));

        $en = $this->faq([], 'apartment-champ-de-mars', 'en');
        $this->assertSame('Can I view this property?', $en['items'][0]['question']);
        $this->assertStringContainsString('Paris 7th', $en['items'][3]['answer']);
    }
}
