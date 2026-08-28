<?php

namespace App\Domain\Seo\Support;

/** https://llmstxt.org — concise, factual site description for LLM crawlers (FR + EN). */
final class LlmsTxt
{
    public function build(): string
    {
        $name = config('seo.site_name');
        $org = config('seo.organization', []);
        $sitemap = url('/sitemap.xml');

        $lines = [
            "# {$name}",
            '',
            '> '.config('seo.llms.summary'),
            '',
            '> '.config('seo.llms.summary_en'),
            '',
            '## Pages principales (FR)',
            '',
            '- [Accueil]('.url('/').") : présentation de {$name}, immobilier de prestige à Paris.",
            '- [Rechercher un bien]('.url('/recherche').') : appartements, hôtels particuliers et biens off-market à Paris.',
            '- [Acheter]('.url('/acheter-immobilier-paris').') : appartements, hôtels particuliers et biens off-market à Paris.',
            '- [Vendre]('.url('/vendre-immobilier-paris').') : vente de biens de prestige à Paris auprès d\'acquéreurs qualifiés.',
            '- [Estimation]('.url('/estimation-immobiliere-paris').') : estimation gratuite d\'un bien à Paris.',
            '- [Contact]('.url('/contact').') : joindre l\'agence par téléphone ou e-mail.',
            '- [FAQ]('.url('/questions-frequentes').') : réponses aux questions sur l\'achat, la vente et l\'estimation d\'un bien de prestige à Paris.',
            '- [Newsletter]('.url('/newsletter').') : lettre hebdomadaire (chaque lundi) sur le marché immobilier de prestige à Paris (tendances, prix, biens off-market).',
            '- [Blog]('.url('/blog').') : conseils pour acheter, vendre ou s\'installer à Paris (quartiers, prix, démarches, fiscalité).',
            '',
            '## Main pages (EN)',
            '',
            '- [Home]('.url('/en').") : {$name}, luxury real estate in Paris.",
            '- [Search a property]('.url('/en/search').') : apartments, private mansions and off-market properties in Paris.',
            '- [Buy]('.url('/en/buy-property-paris').') : apartments, private mansions and off-market properties in Paris.',
            '- [Sell]('.url('/en/sell-property-paris').') : selling luxury property in Paris to qualified buyers.',
            '- [Valuation]('.url('/en/property-valuation-paris').') : free valuation of a property in Paris.',
            '- [Contact]('.url('/en/contact').') : reach the agency by phone or email.',
            '- [FAQ]('.url('/en/faq').') : answers about buying, selling and valuing a luxury property in Paris.',
            '- [Newsletter]('.url('/en/newsletter').') : weekly letter (every Monday) on the Paris luxury property market (trends, prices, off-market opportunities).',
            '- [Journal]('.url('/en/blog').') : advice on buying, selling or settling in Paris (neighbourhoods, prices, procedures, taxes).',
            '',
            '## Ressources',
            '',
            "- [Plan du site / Sitemap]({$sitemap})",
            '- ['.__('legal.legal.title', [], 'fr').']('.url('/mentions-legales').')',
            '- ['.__('legal.privacy.title', [], 'fr').']('.url('/politique-de-confidentialite').')',
        ];

        $contact = array_filter([
            config('seo.llms.contact') ? 'Email : '.config('seo.llms.contact') : null,
            ($org['phone'] ?? null) ? 'Téléphone : '.$org['phone'] : null,
            ($org['address']['street'] ?? null) ? 'Adresse : '.implode(', ', array_filter([$org['address']['street'], trim(($org['address']['postal_code'] ?? '').' '.($org['address']['city'] ?? ''))])) : null,
            config('seo.hours.labels.fr') ? 'Horaires : '.config('seo.hours.labels.fr').' / '.config('seo.hours.labels.en') : null,
        ]);

        if ($contact) {
            array_push($lines, '', '## Contact', '', ...array_map(fn ($l) => "- {$l}", $contact));
        }

        return implode("\n", $lines)."\n";
    }
}
