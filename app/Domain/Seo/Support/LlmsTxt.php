<?php

namespace App\Domain\Seo\Support;

/** https://llmstxt.org — concise, factual site description for LLM crawlers. */
final class LlmsTxt
{
    public function build(): string
    {
        $name = config('seo.site_name');
        $summary = config('seo.llms.summary');
        $contact = config('seo.llms.contact');
        $home = url('/fr');
        $search = url('/fr/recherche');
        $homeEn = url('/en');
        $searchEn = url('/en/search');
        $sitemap = url('/sitemap.xml');

        $lines = [
            "# {$name}",
            '',
            "> {$summary}",
            '',
            '## Pages principales',
            '',
            "- [Accueil (FR)]({$home}) : présentation de {$name}.",
            "- [Recherche (FR)]({$search}) : recherche dans l'ensemble des contenus.",
            "- [Home (EN)]({$homeEn}) : English version.",
            "- [Search (EN)]({$searchEn}) : search across all content.",
            '',
            '## Ressources',
            '',
            "- [Plan du site]({$sitemap})",
            '- ['.__('legal.legal.title').']('.url('/fr/mentions-legales').')',
        ];

        if ($contact) {
            array_push($lines, '', '## Contact', '', "- {$contact}");
        }

        return implode("\n", $lines)."\n";
    }
}
