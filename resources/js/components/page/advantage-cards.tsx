import PageEyebrow from '@/components/page/page-eyebrow';
import { Button } from '@/components/ui/button';
import { useReveal } from '@/hooks/use-reveal';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { type CSSProperties, useRef } from 'react';

export type AdvantageCard = { icon: LucideIcon; title: string; text: string };

type AdvantageCardsProps = {
    /** Id of the section's heading (`aria-labelledby`), unique per page. */
    id: string;
    eyebrow: string;
    /** The h2, phrased as a question (GEO). */
    title: string;
    /** Answer-first intro: a self-contained sentence (brand + what + where). */
    intro: string;
    /** The four cards, one fact each. */
    items: AdvantageCard[];
    /** The only interactive element of the block: an outline button under the grid (intermediate action, never the page's primary one). */
    cta?: { href: string; label: string };
};

/**
 * « Pourquoi … avec Estate in Paris ? » (Figma 712-18480 desktop / 712-18794 mobile, built for the « Acheter » page and
 * generalised on 2026-09-22 to serve « Vendre » as well): the site's sand band (the Figma's grey `#F8F8F8` becomes
 * `from-background-05 to-background`, breaking out to the full screen width, exactly like the testimonials). Centred
 * header (eyebrow, h2 as a question, answer-first intro), then four cards in the site's card (sand hairline, `p-2`,
 * inner sand gradient, square corners, no shadow): a lucide icon in a square tile and a sand Montserrat number
 * `01`-`04` on the top line (same numbering as the About values), a large sand watermark of the icon in the corner (as
 * on the home services), the title (`text-base`) and one factual sentence (`text-sm/6` at every width, smaller than the
 * site's paragraphs on user request 2026-09-21) at the bottom. On hover the card takes the services' look (darker
 * hairline, dark icon tile, stronger watermark — colours only, purely decorative since the card is not a link). The
 * cards rise in cascade when the grid enters the viewport (`useReveal` → `animate-hero-rise`, `--stagger` 80 ms,
 * `motion-reduce` cancels). Stacked on mobile like the Figma, 2×2 from `sm`, four columns from `lg`. The only
 * interactive element is the optional outline button under the grid — improvements applied on user decision 2026-09-21.
 */
export default function AdvantageCards({ id, eyebrow, title, intro, items, cta }: AdvantageCardsProps) {
    const gridRef = useRef<HTMLUListElement>(null);
    const revealed = useReveal(gridRef);

    return (
        <section
            aria-labelledby={id}
            className="from-background-05 to-background relative left-1/2 w-screen -translate-x-1/2 bg-linear-to-b from-40%"
        >
            <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 sm:py-20 lg:gap-14 lg:px-8">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
                    <PageEyebrow>{eyebrow}</PageEyebrow>
                    <h2 id={id} className="text-2xl font-medium tracking-tight text-balance sm:text-3xl">
                        {title}
                    </h2>
                    {/* GEO: a self-contained sentence (brand + what + where) */}
                    <p className="text-muted-foreground max-w-2xl text-base/7 text-pretty sm:text-sm/6">{intro}</p>
                </div>

                <ul ref={gridRef} role="list" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {items.map(({ icon: Icon, title: cardTitle, text }, i) => (
                        <li
                            key={cardTitle}
                            style={{ '--stagger': `${i * 80}ms` } as CSSProperties}
                            className={cn(
                                'group border-secondary-30 hover:border-secondary-50 bg-card flex border p-2 transition-colors duration-300 motion-reduce:transition-none',
                                revealed
                                    ? 'animate-hero-rise [animation-delay:var(--stagger)] motion-reduce:animate-none'
                                    : 'opacity-0 motion-reduce:opacity-100',
                            )}
                        >
                            <div className="from-background-05 relative flex min-h-56 w-full flex-col justify-between gap-10 overflow-hidden bg-linear-to-b to-transparent p-6 lg:min-h-72">
                                {/* Watermark of the icon, always visible (a hover-only reveal would never be seen on mobile), stronger on hover */}
                                <Icon
                                    aria-hidden
                                    strokeWidth={1}
                                    className="text-secondary-30 absolute -right-8 -bottom-8 size-44 opacity-25 transition-opacity duration-500 group-hover:opacity-70 motion-reduce:transition-none"
                                />
                                <div className="relative flex items-start justify-between">
                                    <span
                                        aria-hidden
                                        className="border-secondary-30 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary flex size-11 items-center justify-center border transition-colors duration-300 motion-reduce:transition-none"
                                    >
                                        <Icon className="size-5" strokeWidth={1.5} />
                                    </span>
                                    <span aria-hidden className="font-heading text-secondary-50 text-2xl font-semibold tabular-nums">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                </div>
                                <div className="relative flex flex-col gap-3">
                                    <h3 className="text-base font-medium text-balance">{cardTitle}</h3>
                                    <p className="text-muted-foreground text-sm/6 text-pretty">{text}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>

                {/* A way out of the reassurance block, as an intermediate (outline) action */}
                {cta && (
                    <div className="flex justify-center">
                        <Button asChild variant="outline" size="lg">
                            <Link href={cta.href} prefetch>
                                {cta.label}
                                <ArrowRight aria-hidden />
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}
