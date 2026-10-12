<?php

namespace Tests\Feature;

use Tests\TestCase;

/** Array-shaped query values (`?budget[]=1`) used to crash public GET pages with a 500 (audit 2026-10-12): scalars are read, arrays ignored. */
class QueryParameterRobustnessTest extends TestCase
{
    public function test_array_shaped_query_values_never_crash_public_pages(): void
    {
        foreach ([
            '/nos-biens?budget[]=1', '/nos-biens?sort[]=1', '/nos-biens?area[][]=1', '/nos-biens?bounds[]=1', '/nos-biens?type[][]=1',
            '/nos-biens?transaction[]=rent&furnished[]=1&available[]=1&budget_min[]=1&surface_min[]=1&city[][]=6&rooms[][]=2&bedrooms[][]=1&features[][]=x&condition[][]=x&floor[][]=x',
            '/recherche?q[]=1', '/contact?property[]=x', '/newsletter?search[]=x',
        ] as $url) {
            $this->get($url)->assertOk();
        }
    }
}
