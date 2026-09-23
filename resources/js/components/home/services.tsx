import PageEyebrow from '@/components/page/page-eyebrow';
import { Button } from '@/components/ui/button';
import { useDragScroll } from '@/hooks/use-drag-scroll';
import { useTranslation } from '@/hooks/use-translation';
import { Link } from '@inertiajs/react';
import { ChartNoAxesCombined, ChevronLeft, ChevronRight, KeyRound, type LucideIcon, Tag, UsersRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/** The four service cards (Figma 712-25176): buy, sell, valuation, and the dedicated-advisor support pointing to contact (no relocation page on this site). */
const SERVICES: { key: 'buy' | 'sell' | 'estimate' | 'advice'; route: string; icon: LucideIcon }[] = [
    { key: 'buy', route: 'buy', icon: KeyRound },
    { key: 'sell', route: 'sell', icon: Tag },
    { key: 'estimate', route: 'estimate', icon: ChartNoAxesCombined },
    { key: 'advice', route: 'contact', icon: UsersRound },
];

/**
 * « Ce que nous faisons » (Figma 712-25176 desktop / 712-25611 mobile), adapted to the site's tone: centred header
 * (eyebrow, h2, answer-first intro), then four service cards that are links to the service pages. A card is a light
 * frame with an uppercase Montserrat title, one sentence and a lucide icon at the bottom; on hover / focus it takes
 * the Figma « active » look (sand hairline, sand gradient, icon in a dark square tile, large sand watermark of the
 * icon in the corner) — square corners, no dashed frames, no shadow. On mobile the cards form a snap carousel
 * (draggable with the mouse, each card locked in the middle) with previous / next arrows.
 */
export default function Services() {
    const { t } = useTranslation();
    const rowRef = useRef<HTMLUListElement>(null);
    const [current, setCurrent] = useState(0);
    // Mobile / tablet: every card sits centred, the first one included (side padding = half the viewport minus half a
    // card), the mouse can drag the row and scroll-snap locks the nearest card in the middle (user decision 2026-09-16).
    useDragScroll(rowRef, { align: 'center', open: 'first' });

    // The arrows follow the card closest to the middle (on desktop the row is a grid and does not scroll).
    useEffect(() => {
        const el = rowRef.current;
        if (!el) return;
        const onScroll = () => {
            const cards = Array.from(el.children) as HTMLElement[];
            const centre = el.scrollLeft + el.clientWidth / 2;
            const distance = (card: HTMLElement) => Math.abs(card.offsetLeft + card.offsetWidth / 2 - centre);
            let best = 0;
            cards.forEach((card, i) => {
                if (distance(card) < distance(cards[best])) best = i;
            });
            setCurrent(best);
        };
        // Measured now and again on resize: after mobile → desktop (grid, no scroll) → mobile the row is back at its
        // start while `current` still pointed at the last card scrolled to (bug 2026-09-22).
        onScroll();
        el.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        return () => {
            el.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    const goTo = (index: number) => {
        const el = rowRef.current;
        const card = el?.children[index] as HTMLElement | undefined;
        if (!el || !card) return;
        el.scrollTo({
            left: card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
    };

    return (
        <section aria-labelledby="services-title" className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 sm:py-20 lg:gap-16 lg:px-8">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
                <PageEyebrow>{t('services.eyebrow')}</PageEyebrow>
                <h2 id="services-title" className="text-2xl font-medium tracking-tight text-balance sm:text-3xl">
                    {t('services.title')}
                </h2>
                {/* GEO: a self-contained sentence (brand + what + where) */}
                <p className="text-muted-foreground max-w-2xl text-base/7 text-pretty sm:text-sm/6">{t('services.intro')}</p>
            </div>

            <div className="flex flex-col items-center gap-6">
                <ul
                    ref={rowRef}
                    role="list"
                    className="-mx-6 flex w-[calc(100%+3rem)] cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto px-[calc(50%-9rem)] pb-1 select-none [scrollbar-width:none] data-[dragging=true]:cursor-grabbing data-[dragging=true]:snap-none sm:px-[calc(50%-10rem)] lg:mx-0 lg:grid lg:w-full lg:cursor-auto lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0 lg:select-auto [&::-webkit-scrollbar]:hidden"
                >
                    {SERVICES.map(({ key, route: name, icon: Icon }) => (
                        <li key={key} className="w-72 shrink-0 snap-center sm:w-80 lg:w-auto">
                            <ServiceCard title={t(`services.${key}_title`)} text={t(`services.${key}_text`)} href={route(name)} icon={Icon} />
                        </li>
                    ))}
                </ul>
                {/* Mobile / tablet: previous / next arrows only (the Figma dots were dropped, user decision 2026-09-16) */}
                <div className="flex items-center gap-2 lg:hidden">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className={arrowClass}
                        aria-label={t('services.previous')}
                        disabled={current === 0}
                        onClick={() => goTo(current - 1)}
                    >
                        <ChevronLeft aria-hidden className="transition-transform group-active:-translate-x-0.5 motion-reduce:transition-none" />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className={arrowClass}
                        aria-label={t('services.next')}
                        disabled={current >= SERVICES.length - 1}
                        onClick={() => goTo(current + 1)}
                    >
                        <ChevronRight aria-hidden className="transition-transform group-active:translate-x-0.5 motion-reduce:transition-none" />
                    </Button>
                </div>
            </div>
        </section>
    );
}

/** Same press feedback as the testimonials arrows. */
const arrowClass = 'group transition-transform active:scale-90 motion-reduce:transition-none';

type ServiceCardProps = { title: string; text: string; href: string; icon: LucideIcon };

/** One service card: the site's card (sand hairline, `p-2`, inner sand gradient), a link; hover / focus = darker hairline, dark icon tile, sand watermark of the icon. */
function ServiceCard({ title, text, href, icon: Icon }: ServiceCardProps) {
    return (
        <Link
            href={href}
            prefetch
            className="group focus-ring border-secondary-30 hover:border-secondary-50 focus-visible:border-secondary-50 bg-card flex h-full border p-2 transition-colors duration-300 motion-reduce:transition-none"
        >
            <span className="from-background-05 relative flex min-h-64 w-full flex-col justify-between gap-8 overflow-hidden bg-linear-to-b to-transparent p-6 sm:min-h-72">
                <Icon
                    aria-hidden
                    strokeWidth={1}
                    className="text-secondary-30 absolute -right-8 -bottom-8 size-44 opacity-25 transition-opacity duration-500 group-hover:opacity-70 group-focus-visible:opacity-70 motion-reduce:transition-none"
                />
                <span className="relative flex flex-col gap-3">
                    <span className="font-heading text-lg font-medium">{title}</span>
                    <span className="text-muted-foreground text-base/7 text-pretty sm:text-sm/6">{text}</span>
                </span>
                <span className="border-secondary-30 group-hover:bg-primary group-hover:text-primary-foreground group-focus-visible:bg-primary group-focus-visible:text-primary-foreground group-hover:border-primary group-focus-visible:border-primary relative flex size-11 items-center justify-center border transition-colors duration-300 motion-reduce:transition-none">
                    <Icon aria-hidden className="size-5" strokeWidth={1.5} />
                </span>
            </span>
        </Link>
    );
}
