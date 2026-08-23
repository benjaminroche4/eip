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
            '- [Accueil]('.url('/fr').") : présentation de {$name}, immobilier de prestige à Paris.",
            '- [Rechercher un bien]('.url('/fr/recherche').') : appartements, hôtels particuliers et biens off-market à Paris.',
            '',
            '## Main pages (EN)',
            '',
            '- [Home]('.url('/en').") : {$name}, luxury real estate in Paris.",
            '- [Search a property]('.url('/en/search').') : apartments, private mansions and off-market properties in Paris.',
            '',
            '## Ressources',
            '',
            "- [Plan du site / Sitemap]({$sitemap})",
            '- ['.__('legal.legal.title', [], 'fr').']('.url('/fr/mentions-legales').')',
            '- ['.__('legal.privacy.title', [], 'fr').']('.url('/fr/politique-de-confidentialite').')',
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
