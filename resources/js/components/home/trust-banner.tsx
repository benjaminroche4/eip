import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, ChartNoAxesCombined, Globe, House, LockKeyhole, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const ADVISORS = [
    { id: 1, initials: 'AB' },
    { id: 2, initials: 'CD' },
    { id: 3, initials: 'EF' },
] as const;

/** The four services (Figma 712-25176), each linking to its page — relocation goes to contact for now. */
const SERVICES = [
    { key: 'buy', icon: LockKeyhole, route: 'buy' },
    { key: 'sell', icon: House, route: 'sell' },
    { key: 'estimate', icon: ChartNoAxesCombined, route: 'estimate' },
    { key: 'relocation', icon: Globe, route: 'contact' },
] as const;

/**
 * Trust + services section on the home page (Figma 712-25112 + 712-25176, merged — user decision
 * 2026-08-31): headline stat, advisor avatars & Google rating, pitch and CTAs on the left; the four
 * service cards on the right as a snap slider with pill arrow buttons below, right-aligned. Cards keep
 * the Figma states: dashed hairline at rest, sand gradient + dark icon chip + ghost icon on hover/focus.
 */
export default function TrustBanner() {
    const { t } = useTranslation();
    const { seo } = usePage<SharedData>().props;
    const track = useRef<HTMLUListElement>(null);
    const [pos, setPos] = useState({ start: true, end: false });

    const update = () => {
        const el = track.current;
        if (!el) return;
        setPos({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    };
    useEffect(update, []);

    /** Slides by exactly one card (its rendered width + the 20px track gap). */
    const slide = (direction: 1 | -1) => {
        const el = track.current;
        const card = el?.firstElementChild as HTMLElement | null;
        el?.scrollBy({ left: direction * ((card?.offsetWidth ?? 288) + 20), behavior: 'smooth' });
    };

    const arrowClass =
        'focus-ring border-border hover:bg-background-05 flex h-12 w-18 items-center justify-center rounded-full border disabled:opacity-40 disabled:hover:bg-transparent';

    return (
        <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-3">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-6">
                        <h2 className="text-2xl font-medium tracking-tight text-balance sm:text-3xl">
                            <span className="font-semibold">{t('home.trust_stat')}</span> {t('home.trust_title_1')}
                            <br />
                            {t('home.trust_title_2')}
                        </h2>
                        <div className="flex items-center gap-4">
                            <span aria-hidden className="flex -space-x-1.5">
                                {ADVISORS.map((a) => (
                                    <Avatar key={a.id} className="ring-background size-8 ring-2">
                                        <AvatarImage src={`/images/advisors/advisor-${a.id}.webp`} alt="" loading="lazy" />
                                        <AvatarFallback className="bg-background-10 text-foreground text-xs font-medium">{a.initials}</AvatarFallback>
                                    </Avatar>
                                ))}
                            </span>
                            {seo.reviews && (
                                <p className="flex items-center gap-2 text-sm">
                                    <Star aria-hidden className="size-4 shrink-0 fill-current" />
                                    <span className="font-medium">{t('home.trust_rating', { rating: String(seo.reviews.rating) })}</span>
                                    <span className="text-muted-foreground">{t('home.trust_reviews', { count: String(seo.reviews.count) })}</span>
                                </p>
                            )}
                        </div>
                    </div>
                    <p className="text-muted-foreground max-w-xl text-base/7 text-pretty sm:text-sm/6">{t('home.trust_text')}</p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                        <Button asChild size="lg" className="rounded-full">
                            <Link href={route('buy')} prefetch>
                                {t('home.trust_cta_properties')}
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="rounded-full">
                            <Link href={route('contact')} prefetch>
                                {t('home.trust_cta_contact')}
                            </Link>
                        </Button>
                    </div>
                </div>
                <div className="flex min-w-0 flex-col gap-6">
                    <ul
                        ref={track}
                        onScroll={update}
                        role="list"
                        className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
                    >
                        {/* Two cards visible at a time on desktop (user decision): half the track minus half the 20px gap */}
                        {SERVICES.map(({ key, icon: Icon, route: name }) => (
                            <li key={key} className="w-72 shrink-0 snap-start lg:w-[calc(50%-0.625rem)]">
                                <Link
                                    href={route(name)}
                                    prefetch
                                    className="group focus-ring border-border hover:border-secondary-50 hover:from-background-08 hover:to-background-05 focus-visible:border-secondary-50 focus-visible:from-background-08 focus-visible:to-background-05 relative flex min-h-64 flex-col justify-between overflow-hidden rounded-none border border-dashed bg-linear-to-b from-transparent to-transparent p-6 hover:border-solid focus-visible:border-solid"
                                >
                                    <span className="flex flex-col gap-3">
                                        <h3 className="font-heading text-sm font-semibold tracking-wide uppercase">
                                            {t(`home.services_${key}_title`)}
                                        </h3>
                                        <p className="text-muted-foreground text-sm/6 text-pretty">{t(`home.services_${key}_text`)}</p>
                                    </span>
                                    {/* Oversized ghost of the icon, revealed with the sand surface (Figma hovered card) */}
                                    <Icon
                                        aria-hidden
                                        className="text-secondary-50/60 pointer-events-none absolute -right-4 -bottom-4 size-32 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
                                    />
                                    <span className="group-hover:bg-primary group-hover:text-primary-foreground group-focus-visible:bg-primary group-focus-visible:text-primary-foreground relative -m-2 flex size-10 shrink-0 items-center justify-center self-start rounded-none p-2">
                                        <Icon aria-hidden className="size-5" />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            aria-label={t('home.services_prev')}
                            disabled={pos.start}
                            onClick={() => slide(-1)}
                            className={arrowClass}
                        >
                            <ArrowLeft aria-hidden className="size-5" />
                        </button>
                        <button type="button" aria-label={t('home.services_next')} disabled={pos.end} onClick={() => slide(1)} className={arrowClass}>
                            <ArrowRight aria-hidden className="size-5" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
