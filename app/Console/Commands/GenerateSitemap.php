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
        $dir = rtrim((string) config('seo.sitemap_dir'), '/');
        if (! is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        foreach ($builder->build() as $file => $sitemap) {
            $sitemap->writeToFile($dir.'/'.$file);
            $this->line("$file written.");
        }
        $this->info('Sitemap index generated.');

        return self::SUCCESS;
    }
}
