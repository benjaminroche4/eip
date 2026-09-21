import CountryFlag from '@/components/i18n/country-flag';
import GradientHairline from '@/components/layout/gradient-hairline';
import PageEyebrow from '@/components/page/page-eyebrow';
import SeoImage from '@/components/seo/seo-image';
import { Button } from '@/components/ui/button';
import { useDragScroll } from '@/hooks/use-drag-scroll';
import { useTranslation } from '@/hooks/use-translation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { type Country } from 'react-phone-number-input';

/** `languages` = readable label (« Français et anglais », sr-only), `flags` = the flags shown in the chip (user decision 2026-09-16). */
export type TeamMember = { name: string; role: string; languages: string; flags: Country[]; photo: string };

type TeamGridProps = { members: TeamMember[] };

/** Same press feedback as the other carousels' arrows. */
const arrowClass = 'group transition-transform active:scale-90 motion-reduce:transition-none';

/**
 * « Notre équipe » (Figma 712-23908 desktop / 712-24310 mobile), in the site's tone: header with the eyebrow + h2 on
 * the left and the intro on the right (stacked and centred on mobile), then one **site card** per person (sand hairline, `p-2`, inner sand
 * gradient — user decision 2026-09-16) holding the square portrait (3:4 in the Figma, square on user decision 2026-09-16), the name in Montserrat, the role, and the spoken languages as flags in a sand chip. Desktop = grid of three; mobile /
 * tablet = one centred card at a time, draggable with the mouse, previous / next arrows. The Figma « View full team »
 * button has no destination on this site and was left out.
 */
export default function TeamGrid({ members }: TeamGridProps) {
    const { t } = useTranslation();
    const rowRef = useRef<HTMLUListElement>(null);
    const [current, setCurrent] = useState(0);
    useDragScroll(rowRef, { align: 'center', open: 'first' });

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
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
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
        <section aria-labelledby="team-title" className="flex flex-col gap-10 lg:gap-16">
            <div className="flex flex-col items-center gap-4 text-center lg:flex-row lg:items-end lg:justify-between lg:gap-12 lg:text-left">
                <div className="flex flex-col items-center gap-4 lg:items-start">
                    <PageEyebrow>{t('team.eyebrow')}</PageEyebrow>
                    <h2 id="team-title" className="max-w-lg text-2xl font-medium tracking-tight text-balance sm:text-3xl">
                        {t('team.title')}
                    </h2>
                </div>
                <p className="text-muted-foreground max-w-md text-base/7 text-pretty sm:text-sm/6">{t('team.intro')}</p>
            </div>

            <div className="flex flex-col items-center gap-6">
                <ul
                    ref={rowRef}
                    role="list"
                    className="-mx-6 flex w-[calc(100%+3rem)] cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto px-[calc(50%-9rem)] pb-1 select-none [scrollbar-width:none] data-[dragging=true]:cursor-grabbing data-[dragging=true]:snap-none sm:px-[calc(50%-10rem)] lg:mx-0 lg:grid lg:w-full lg:cursor-auto lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0 lg:select-auto [&::-webkit-scrollbar]:hidden"
                >
                    {members.map((member) => (
                        <li key={member.name} className="w-72 shrink-0 snap-center sm:w-80 lg:w-auto">
                            {/* The site's card: sand hairline, p-2, inner sand gradient (as the CTA card, the quotes, the recap) */}
                            <div className="border-secondary-30 bg-card flex h-full border p-2">
                                <div className="from-background-05 flex w-full flex-col gap-5 bg-linear-to-b to-transparent p-4 pb-6">
                                    <div className="from-background-10 to-background-05 aspect-square w-full bg-linear-to-b">
                                        <SeoImage src={member.photo} alt="" width={800} height={800} className="size-full object-cover" />
                                    </div>
                                    {/* Footer (ui.sh variant « Aligné à gauche, hairline, chip langues », kept again among 15 card variants, user decisions 2026-09-16) */}
                                    <div className="flex flex-col gap-4">
                                        <GradientHairline />
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-lg font-medium">{member.name}</h3>
                                                <p className="text-muted-foreground text-sm">{member.role}</p>
                                            </div>
                                            {/* Languages as flags (user decision 2026-09-16), the readable label stays for assistive tech */}
                                            <span className="bg-background-08 flex shrink-0 items-center gap-1.5 px-2 py-1.5">
                                                <span className="sr-only">{member.languages}</span>
                                                {member.flags.map((flag) => (
                                                    <CountryFlag key={flag} country={flag} />
                                                ))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
                <div className="flex items-center gap-2 lg:hidden">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className={arrowClass}
                        aria-label={t('team.previous')}
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
                        aria-label={t('team.next')}
                        disabled={current === members.length - 1}
                        onClick={() => goTo(current + 1)}
                    >
                        <ChevronRight aria-hidden className="transition-transform group-active:translate-x-0.5 motion-reduce:transition-none" />
                    </Button>
                </div>
            </div>
        </section>
    );
}
