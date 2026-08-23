<?php

namespace App\Http\Controllers;

use App\Domain\Seo\Support\LlmsTxt;
use App\Domain\Seo\Support\RobotsTxt;
use Illuminate\Http\Response;

/** Text endpoints for crawlers and AI agents, always in sync with APP_URL and config/seo.php. */
class SeoController extends Controller
{
    public function robots(RobotsTxt $robots): Response
    {
        return response($robots->build())->header('Content-Type', 'text/plain; charset=UTF-8');
    }

    public function llms(LlmsTxt $llms): Response
    {
        return response($llms->build())->header('Content-Type', 'text/markdown; charset=UTF-8');
    }
}
