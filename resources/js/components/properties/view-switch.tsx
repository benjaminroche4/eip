import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { List, Map as MapIcon } from 'lucide-react';
import { type Ref, type RefObject, useEffect, useState } from 'react';

type ViewSwitchProps = {
    view: 'list' | 'map';
    onToggle: () => void;
    /** The closing CTA card: the switch leaves the list once the card is in view or scrolled past (it was floating over the CTA and the footer, 2026-09-28); it always stays over the map. */
    until?: RefObject<HTMLElement | null>;
    ref?: Ref<HTMLDivElement>;
};

/**
 * Floating list / map switch of the properties page under `lg` (Airbnb-like, user decision 2026-09-28): a square
 * two-segment control fixed at the bottom centre of the screen — white, sand hairline, the active view in the dark
 * primary — ui.sh variant « Segment Liste | Carte, carré » chosen among 25 (user decision 2026-09-28: it names the
 * state, not just the action, and follows the search bar's grammar). Each segment is `aria-pressed`; the dark slab
 * slides between them on change. Hidden while the closing card (`until`) is visible or already passed, like the
 * « Vendre » mobile bar, so it never covers the CTA or the footer (2026-09-28); never hidden over the full-screen map.
 */
export default function ViewSwitch({ view, onToggle, until, ref }: ViewSwitchProps) {
    const { t } = useTranslation();
    // « End reached » = the closing card is visible or its top is already above the viewport's bottom
    const [endReached, setEndReached] = useState(false);

    useEffect(() => {
        const end = until?.current;
        if (!end || typeof IntersectionObserver === 'undefined') return;
        const watch = new IntersectionObserver(([entry]) => setEndReached(entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight));
        watch.observe(end);
        return () => watch.disconnect();
    }, [until]);

    if (endReached && view === 'list') return null;

    return (
        <div
            ref={ref}
            role="group"
            aria-label={t('properties.view_label')}
            className="bg-card border-secondary-30 animate-fade-in fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border p-1 motion-reduce:animate-none lg:hidden"
        >
            {/* The dark slab slides from one segment to the other (300 ms expo-out, still under reduced motion — user decision
                2026-09-28); the two segments share the same width so the slab is exactly half the track */}
            <div className="relative grid grid-cols-2">
                <span
                    aria-hidden
                    className={cn(
                        'bg-primary absolute inset-y-0 left-0 w-1/2 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                        view === 'map' ? 'translate-x-full' : 'translate-x-0',
                    )}
                />
                {(['list', 'map'] as const).map((v) => (
                    <button
                        key={v}
                        type="button"
                        aria-pressed={view === v}
                        onClick={() => view !== v && onToggle()}
                        className={cn(
                            'focus-ring relative flex h-9 items-center justify-center gap-2 px-4 text-sm font-medium transition-colors duration-300 motion-reduce:transition-none',
                            view === v ? 'text-primary-foreground' : 'text-muted-foreground hover:bg-background-05',
                        )}
                    >
                        {v === 'list' ? <List aria-hidden className="size-4" /> : <MapIcon aria-hidden className="size-4" />}
                        {t(v === 'list' ? 'properties.view_list' : 'properties.view_map')}
                    </button>
                ))}
            </div>
        </div>
    );
}
