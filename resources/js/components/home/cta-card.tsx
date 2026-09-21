import RingsBackdrop from '@/components/page/rings-backdrop';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

/** Advisor portraits from public/images/advisors (same trio as the footer contact card). */
const ADVISORS = [
    { id: 1, initials: 'AB' },
    { id: 2, initials: 'CD' },
    { id: 3, initials: 'EF' },
] as const;

/**
 * Closing call to action (Figma 712-24182 desktop / 712-24510 mobile, restyled on user decision 2026-09-16 — ui.sh
 * variant « Carte sable du site »): the site's card (sand hairline, inner sand gradient, square corners), the three
 * advisors' portraits, a Montserrat title, one sentence and a primary « Contacter un conseiller » button.
 * No dashed waves, no « 2 500+ owners » pill; behind them, faint concentric sand circles that turn and breathe imperceptibly (`RingsBackdrop`, shared with the about manifesto).
 */
export default function CtaCard() {
    const { t } = useTranslation();

    return (
        <section aria-labelledby="cta-card-title" className="border-secondary-30 bg-card border p-2">
            <div className="from-background-05 relative isolate flex flex-col items-center gap-8 bg-linear-to-b to-transparent px-5 py-10 text-center sm:px-10 sm:py-12">
                <RingsBackdrop />
                <div className="flex flex-col items-center gap-5">
                    <ul role="list" aria-label={t('footer.advisors')} className="flex -space-x-3">
                        {ADVISORS.map((a) => (
                            <li key={a.id}>
                                <Avatar className="ring-card size-12 ring-2">
                                    <AvatarImage src={`/images/advisors/advisor-${a.id}.webp`} alt="" loading="lazy" />
                                    <AvatarFallback className="bg-background-10 text-foreground text-xs font-medium">{a.initials}</AvatarFallback>
                                </Avatar>
                            </li>
                        ))}
                    </ul>
                    <div className="flex flex-col items-center gap-3">
                        <h2 id="cta-card-title" className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                            {t('cta.title')}
                        </h2>
                        <p className="text-muted-foreground max-w-2xl text-base/7 text-pretty sm:text-sm/6">{t('cta.text')}</p>
                    </div>
                </div>
                <Button asChild size="lg">
                    <Link href={route('contact')} prefetch>
                        {t('cta.button')}
                        <ArrowRight aria-hidden />
                    </Link>
                </Button>
            </div>
        </section>
    );
}
