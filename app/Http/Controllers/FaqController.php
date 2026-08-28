<?php

namespace App\Http\Controllers;

use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FaqController extends Controller
{
    /**
     * Categories and their questions live in lang/{locale}/ui.php (faq.categories): one list feeds the HTML and
     * the FAQPage JSON-LD. Each topic and question gets a stable slug (from its title) used as URL anchor.
     */
    public function __invoke(): Response
    {
        $categories = array_map(fn (array $category) => [
            ...$category,
            'slug' => Str::slug($category['title']),
            'items' => array_map(fn (array $item) => [...$item, 'slug' => Str::slug($item['question'])], $category['items']),
        ], __('ui.faq.categories'));

        return Inertia::render('faq', ['categories' => $categories]);
    }
}
