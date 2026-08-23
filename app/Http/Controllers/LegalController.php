<?php

namespace App\Http\Controllers;

use App\Domain\Legal\Data\LegalPage;
use Inertia\Inertia;
use Inertia\Response;

/** Privacy policy, legal notice and terms — one Inertia page, content from lang/{locale}/legal.php. */
class LegalController extends Controller
{
    public function __invoke(string $key): Response
    {
        return Inertia::render('legal', ['page' => LegalPage::fromKey($key)->toArray()]);
    }
}
