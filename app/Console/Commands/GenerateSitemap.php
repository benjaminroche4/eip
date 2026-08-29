<?php

namespace App\Console\Commands;

use App\Domain\Seo\Support\SitemapBuilder;
use Illuminate\Console\Command;

class GenerateSitemap extends Command
{
    protected $signature = 'sitemap:generate';

    protected $description = 'Generate public/sitemap.xml (index) and its sub-sitemaps (pages, blog)';

    public function handle(SitemapBuilder $builder): int
    {
        foreach ($builder->build() as $file => $sitemap) {
            $sitemap->writeToFile(public_path($file));
            $this->line("$file written.");
        }
        $this->info('Sitemap index generated.');

        return self::SUCCESS;
    }
}
