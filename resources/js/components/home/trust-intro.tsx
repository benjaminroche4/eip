import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';

/** Advisor portraits (public/images/advisors), the same trio as the footer, the CTA card and the About hero. */
const ADVISORS = [
    { id: 1, initials: 'AB' },
    { id: 2, initials: 'CD' },
    { id: 3, initials: 'EF' },
] as const;

type TrustIntroProps = {
    /** The headline figure (`about.stats`, e.g. « 500+ ») — a real number, never the Figma's « 2,500+ ». */
    figure: string;
};

/**
 * Trust intro under the home hero (Figma 712-25112 desktop / 712-25584 mobile, 2026-09-22): on the left a two-line
 * Montserrat statement (the real figure in semibold + « Un interlocuteur unique. ») and the proof line (the three
 * advisor portraits, the Google logo, the real Google rating and review count from `seo.reviews` — hidden without
 * figures); on the right the answer-first paragraph and two buttons (primary → buy, outline → contact). Centred and
 * stacked on mobile with full-width buttons, two columns from `lg`.
 */
export default function TrustIntro({ figure }: TrustIntroProps) {
    const { t, tc } = useTranslation();
    const { seo } = usePage<SharedData>().props;
    const reviews = seo.reviews;

    return (
        <section
            aria-labelledby="trust-intro-title"
            className="mx-auto grid max-w-7xl gap-10 px-6 py-16 text-center sm:py-20 lg:grid-cols-2 lg:gap-24 lg:px-8 lg:text-left"
        >
            <div className="flex flex-col items-center gap-6 lg:items-start">
                <h2 id="trust-intro-title" className="text-2xl font-medium tracking-tight text-balance sm:text-3xl lg:text-4xl">
                    <span className="font-semibold tabular-nums">{figure}</span> {t('home.trust_title_1')}
                    <br />
                    {t('home.trust_title_2')}
                </h2>
                {/* Proof line: portraits + the real Google rating (hidden without figures) */}
                {reviews && (
                    <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                        <ul role="list" aria-label={t('footer.advisors')} className="flex -space-x-2">
                            {ADVISORS.map((a) => (
                                <li key={a.id}>
                                    <Avatar className="ring-card size-8 ring-2">
                                        <AvatarImage src={`/images/advisors/advisor-${a.id}.webp`} alt="" loading="lazy" />
                                        <AvatarFallback className="bg-background-10 text-foreground text-xs font-medium">{a.initials}</AvatarFallback>
                                    </Avatar>
                                </li>
                            ))}
                        </ul>
                        {/* Google logo (brand mark as <img>, like the testimonials block) instead of the Figma's star; « Google » stays for screen readers */}
                        <p className="flex items-center gap-2 text-sm">
                            <img src="/images/social/google.svg" alt="" width={16} height={16} className="size-4 shrink-0" />
                            <span className="font-medium tabular-nums">{reviews.rating.toLocaleString('fr-FR')}/5</span>
                            <span className="text-muted-foreground">
                                {tc('testimonials.based_on', reviews.count, { count: reviews.count.toLocaleString('fr-FR') })}
                                <span className="sr-only"> Google</span>
                            </span>
                        </p>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center gap-8 lg:items-start lg:gap-12 lg:pt-1">
                {/* GEO: a self-contained sentence (brand + since when + what + where) */}
                <p className="text-muted-foreground max-w-xl text-base/7 text-pretty sm:text-sm/6 lg:text-base/7">{t('home.trust_text')}</p>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
                    <Button asChild size="lg">
                        <Link href={route('buy')} prefetch>
                            {t('home.trust_cta_buy')}
                            <ArrowUpRight aria-hidden />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href={route('contact')} prefetch>
                            {t('home.trust_cta_contact')}
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
