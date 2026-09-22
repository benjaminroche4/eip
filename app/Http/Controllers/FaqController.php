<?php

namespace App\Http\Controllers;

use App\Domain\Content\Actions\ListFaqCategories;
use App\Domain\Content\Support\ContentList;
use Inertia\Inertia;
use Inertia\Response;

/** FAQ page: the topics and questions of `Domain/Content` (slugs = URL anchors) in the visitor's language. */
class FaqController extends Controller
{
    public function __invoke(ListFaqCategories $categories): Response
    {
        return Inertia::render('faq', ['categories' => ContentList::toArray($categories())]);
    }
}
