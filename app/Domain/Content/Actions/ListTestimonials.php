<?php

namespace App\Domain\Content\Actions;

use App\Domain\Content\Data\Testimonial;

/** The client reviews of the home and About pages, from `testimonials.items` in lang/{locale}/ui.php. */
final class ListTestimonials
{
    /** @return list<Testimonial> */
    public function __invoke(?string $locale = null): array
    {
        return array_map(Testimonial::fromArray(...), array_values(__('ui.testimonials.items', [], $locale)));
    }
}
