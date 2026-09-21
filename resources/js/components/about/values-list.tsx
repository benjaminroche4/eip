import GradientHairline from '@/components/layout/gradient-hairline';
import PageEyebrow from '@/components/page/page-eyebrow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { type CSSProperties, Fragment, useEffect, useRef, useState } from 'react';

const VALUES = [1, 2, 3, 4, 5] as const;

/**
 * « Nos valeurs » (layout of Figma 712-24134 / 712-24468, turned into a values block on user decision 2026-09-16):
 * sticky left column with the header (eyebrow, h2, answer-first intro), the advisor and a contact button; on the right
 * an `<ol>` of five values threaded by a vertical gradient hairline — big sand Montserrat number with its dot on the
 * thread, title and one sentence, gradient hairlines between them. The value closest to the middle of the viewport is
 * the active one (nearest to the middle line, measured on scroll — not an IntersectionObserver band, which skipped the
 * shortest value): its number "locks in" — lands from a slight overscale while its blur clears and
 * turns dark, and the dot on the thread emits one ring (`animate-value-lock` / `animate-value-ring`, user decision
 * 2026-09-21; nothing is active until the user scrolls a value into the band). Each row is also a button: a click or
 * Enter / Space activates it, `aria-current` on the active one (user decision 2026-09-21, as on the buy strategies).
 * The list rises in cascade when it enters the viewport (`--stagger`, `motion-reduce` cancels).
 */
export default function ValuesList() {
    const { t } = useTranslation();
    const { seo } = usePage<SharedData>().props;
    const advisor = seo.advisor;
    const listRef = useRef<HTMLOListElement>(null);
    const [active, setActive] = useState<number | null>(null);
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const items = Array.from(list.querySelectorAll('li'));

        // Active value = the one under the middle line of the viewport, else the nearest one to it, computed from the
        // geometry on every scroll frame. An IntersectionObserver on a thin middle band missed the shortest value
        // (« Réactivité ») when it crossed the band between two callbacks (bug 2026-09-21: 3 → 5, never 4).
        let frame = 0;
        const follow = () => {
            frame = 0;
            const center = window.innerHeight / 2;
            const bounds = list.getBoundingClientRect();
            if (bounds.top > center || bounds.bottom < center) return; // the list has not reached the middle yet: nothing active
            let best = 0;
            let bestDistance = Infinity;
            items.forEach((item, i) => {
                const rect = item.getBoundingClientRect();
                const distance = center < rect.top ? rect.top - center : center > rect.bottom ? center - rect.bottom : 0;
                if (distance < bestDistance) {
                    bestDistance = distance;
                    best = i;
                }
            });
            setActive(best);
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(follow);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        follow(); // the page may load already scrolled

        if (typeof IntersectionObserver === 'undefined') {
            setRevealed(true);
        }
        const reveal =
            typeof IntersectionObserver === 'undefined'
                ? null
                : new IntersectionObserver(
                      (entries) => {
                          if (entries.some((e) => e.isIntersecting)) {
                              setRevealed(true);
                              reveal?.disconnect();
                          }
                      },
                      { rootMargin: '0px 0px -10% 0px' },
                  );
        reveal?.observe(list);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (frame) cancelAnimationFrame(frame);
            reveal?.disconnect();
        };
    }, []);

    return (
        <section aria-labelledby="values-title" className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-24">
            <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
                <div className="flex flex-col gap-4">
                    <PageEyebrow>{t('values.eyebrow')}</PageEyebrow>
                    <h2 id="values-title" className="max-w-md text-2xl font-medium tracking-tight text-balance sm:text-3xl">
                        {t('values.title')}
                    </h2>
                    {/* GEO: a self-contained sentence (brand + what + where) */}
                    <p className="text-muted-foreground max-w-md text-base/7 text-pretty sm:text-sm/6">{t('values.intro')}</p>
                </div>
                {advisor && (
                    <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                            <AvatarImage src={advisor.photo} alt="" loading="lazy" />
                            <AvatarFallback className="bg-background-10 text-foreground text-xs font-medium">
                                {advisor.name.slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <p className="flex flex-col text-sm">
                            <span className="font-medium">{advisor.name}</span>
                            <span className="text-muted-foreground text-xs">{t('values.advisor_line')}</span>
                        </p>
                    </div>
                )}
                <Button asChild size="lg" className="w-fit">
                    <Link href={route('contact')} prefetch>
                        {t('values.cta')}
                        <ArrowRight aria-hidden />
                    </Link>
                </Button>
            </div>

            {/* Thread: a vertical gradient hairline running along the numbers */}
            <ol ref={listRef} className="relative flex flex-col gap-6 pl-6 lg:gap-8">
                <GradientHairline vertical className="absolute top-2 bottom-2 left-0" />
                {VALUES.map((n, i) => (
                    <Fragment key={n}>
                        {i > 0 && <GradientHairline />}
                        <li
                            style={{ '--stagger': `${i * 80}ms` } as CSSProperties}
                            className={cn(
                                'relative',
                                revealed
                                    ? 'animate-hero-rise [animation-delay:var(--stagger)] motion-reduce:animate-none'
                                    : 'opacity-0 motion-reduce:opacity-100',
                            )}
                        >
                            <span
                                aria-hidden
                                className={cn(
                                    'ring-background absolute top-4 -left-6 size-2 -translate-x-1/2 rounded-full ring-4 transition-colors duration-300',
                                    active === i ? 'bg-foreground' : 'bg-secondary-60',
                                )}
                            />
                            {/* Lock-in ring: emitted once by the dot when this value becomes active (mounted only then, so it replays per lock) */}
                            {active === i && (
                                <span
                                    aria-hidden
                                    data-testid="value-ring"
                                    className="border-foreground animate-value-ring absolute top-4 -left-6 size-2 rounded-full border motion-reduce:hidden"
                                />
                            )}
                            {/* The whole row is a button (user decision 2026-09-21, as on the buy strategies): a click or Enter / Space
                                activates the value in addition to the scroll. Number and title share a line at every width; the sentence comes under. */}
                            <button
                                type="button"
                                onClick={() => setActive(i)}
                                aria-current={active === i ? 'true' : undefined}
                                className="group focus-ring hover:bg-background-05 -m-3 flex w-[calc(100%+1.5rem)] flex-col gap-2 p-3 text-left transition-colors duration-300 motion-reduce:transition-none sm:flex-row sm:gap-10"
                            >
                                <span
                                    aria-hidden
                                    className={cn(
                                        'font-heading w-16 shrink-0 origin-left text-4xl font-semibold tabular-nums transition-colors duration-300 motion-reduce:transition-none',
                                        active === i
                                            ? 'text-foreground animate-value-lock motion-reduce:animate-none'
                                            : 'text-secondary-50 group-hover:text-secondary-60',
                                    )}
                                >
                                    {String(n).padStart(2, '0')}
                                </span>
                                <span className="flex flex-col gap-2 sm:pt-2">
                                    <h3 className="text-lg font-medium">{t(`values.value_${n}_title`)}</h3>
                                    <span className="text-muted-foreground block max-w-prose text-base/7 text-pretty sm:text-sm/6">
                                        {t(`values.value_${n}_text`)}
                                    </span>
                                </span>
                            </button>
                        </li>
                    </Fragment>
                ))}
            </ol>
        </section>
    );
}
