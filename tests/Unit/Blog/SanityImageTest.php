<?php

namespace Tests\Unit\Blog;

use App\Domain\Blog\Support\SanityImage;
use PHPUnit\Framework\TestCase;

class SanityImageTest extends TestCase
{
    public function test_resolves_cdn_url_size_and_srcset_from_asset_ref(): void
    {
        $image = (new SanityImage('proj', 'production'))->resolve(['alt' => 'Paris', 'asset' => ['_ref' => 'image-abc-1000x500-jpg']]);

        $this->assertSame('https://cdn.sanity.io/images/proj/production/abc-1000x500.jpg?w=1200&auto=format&fit=max', $image['url']);
        $this->assertSame(1000, $image['width']);
        $this->assertSame(500, $image['height']);
        $this->assertSame('Paris', $image['alt']);
        $this->assertSame('https://cdn.sanity.io/images/proj/production/abc-1000x500.jpg?w=480&auto=format&fit=max 480w, https://cdn.sanity.io/images/proj/production/abc-1000x500.jpg?w=800&auto=format&fit=max 800w', $image['srcset']);
    }

    public function test_returns_null_for_missing_or_malformed_refs(): void
    {
        $images = new SanityImage('proj', 'production');

        $this->assertNull($images->resolve(null));
        $this->assertNull($images->resolve(['asset' => ['_ref' => 'file-abc-pdf']]));
    }
}
