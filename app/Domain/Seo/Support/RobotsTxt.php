<?php

namespace App\Domain\Seo\Support;

final class RobotsTxt
{
    /** @var list<string> Paths never meant to be crawled. */
    private const PRIVATE_PATHS = ['/dashboard', '/settings', '/login', '/register', '/forgot-password', '/reset-password'];

    /** @var list<string> AI / answer-engine crawlers explicitly allowed on public content (GEO). */
    private const AI_AGENTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'anthropic-ai', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'];

    public function build(): string
    {
        $disallow = implode("\n", array_map(fn ($p) => "Disallow: $p", self::PRIVATE_PATHS));
        $aiAgents = implode("\n", array_map(fn ($a) => "User-agent: $a", self::AI_AGENTS));

        return <<<TXT
        # Classic search engines
        User-agent: *
        Allow: /
        {$disallow}
        Disallow: /fr/recherche?*
        Disallow: /en/search?*

        # AI / answer engines (GEO)
        {$aiAgents}
        Allow: /
        Disallow: /dashboard
        Disallow: /settings

        Sitemap: {$this->sitemapUrl()}
        TXT;
    }

    private function sitemapUrl(): string
    {
        return url('/sitemap.xml');
    }
}
