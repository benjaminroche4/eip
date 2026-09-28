import { rise } from '@/components/home/hero-rise';
import SearchBar from '@/components/search/search-bar';
import { SMALL_SCREEN, useMediaQuery } from '@/hooks/use-media-query';
import { useSearchDraft } from '@/hooks/use-search-draft';
import { useTranslation } from '@/hooks/use-translation';
import { groupThousands } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { useState } from 'react';

/** Title of the block: the site's h1 scale (the former hero h1 sizes), mixed case with a light tracking (user decisions 2026-09-25). */
const TITLE = 'font-heading text-center text-2xl/9 font-semibold tracking-wide text-balance text-white drop-shadow-md sm:text-4xl/13 lg:text-5xl/16';

type HeroSearchProps = { className?: string };

/**
 * Search bar of the home hero (Figma 712-25068 desktop / 712-25576 mobile, integrated 2026-09-25). Two criteria, the
 * arrondissements and the max budget, in the shared `SearchBar` (`components/search/search-bar.tsx`):
 * - City = a multi-select typed **directly in the cell** (user decision 2026-09-25, « fais tout de 1 à 5 »): the input is a
 *   combobox over the arrondissements (« 16 », « 16e », « 75016 », « Paris 6 »); arrows highlight, Enter toggles the
 *   highlighted row and clears the text, Backspace on an empty text removes the last pill, Escape closes. Each chosen
 *   arrondissement is a square sand pill with its own « × »; a « Tout Paris » pill stands for no filter; the pills
 *   stay on one line and collapse to the last picked one + « +N » when they would overflow (measured on an invisible
 *   twin). The list has a footer with the live count and « Terminé ».
 * - Budget = digit-only input grouping its thousands, with quick amounts offered while it has the focus.
 * - The same popovers at every width; on mobile the arrondissement cell is read-only with `inputMode="none"`, so it
 *   opens the list without the keyboard, and no row is highlighted.
 * - The criteria are **remembered for the session** (`useSearchDraft`) and **submitted as a GET to the properties
 *   page** (`city[]`, `budget`) since the listing exists (2026-09-25).
 * - Motion (all `motion-reduce`-safe): title, card and trust row rising in cascade (`hero-rise` steps 0, 1 and 3), a
 *   pill pops in and fades out before leaving (`pop` / `pill-out`), the panels rise 4px in fade (`panel-in`), the
 *   counter pops on each change, the magnifier nudges up-right and turns sand on hover.
 */
export default function HeroSearch({ className }: HeroSearchProps) {
    const { t, locale } = useTranslation();
    const small = useMediaQuery(SMALL_SCREEN);
    const [cities, setCities] = useState<number[]>([]);
    const [budget, setBudget] = useState('');
    useSearchDraft({ cities, budget }, (draft) => {
        setCities(draft.cities);
        setBudget(groupThousands(draft.budget, locale));
    });

    return (
        <form
            role="search"
            aria-label={t('search_bar.label')}
            method="get"
            action={route('properties')}
            className={cn('mx-auto w-full max-w-3xl', className)}
        >
            <div className="flex w-full flex-col gap-6 sm:gap-8">
                <p style={rise(0).style} className={cn(TITLE, rise(0).className)}>
                    {t('home.search_title')}
                </p>
                <div style={rise(1).style} className={rise(1).className}>
                    <SearchBar small={small} cities={cities} setCities={setCities} budget={budget} setBudget={setBudget} />
                </div>
            </div>
        </form>
    );
}
