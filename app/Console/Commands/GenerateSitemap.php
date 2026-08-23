<?php

namespace App\Console\Commands;

use App\Domain\Seo\Support\SitemapBuilder;
use Illuminate\Console\Command;

class GenerateSitemap extends Command
{
    protected $signature = 'sitemap:generate';

    protected $description = 'Generate public/sitemap.xml from indexable routes';

    public function handle(SitemapBuilder $builder): int
    {
        $builder->build()->writeToFile(public_path('sitemap.xml'));
        $this->info('sitemap.xml generated.');

        return self::SUCCESS;
    }
}
