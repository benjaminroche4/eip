<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

/** Home page: hero, services, testimonials (`testimonials.items`, portraits in public/images/testimonials), success stories (`stories.items`, photos in public/images/stories), closing CTA. */
class HomeController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('home', ['testimonials' => __('ui.testimonials.items'), 'stories' => __('ui.stories.items')]);
    }
}
