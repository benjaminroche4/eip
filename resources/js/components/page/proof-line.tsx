import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Star } from 'lucide-react';

/** Advisor portraits (public/images/advisors), the same trio as the footer and the CTA card. */
const ADVISORS = [
    { id: 1, initials: 'AB' },
    { id: 2, initials: 'CD' },
    { id: 3, initials: 'EF' },
] as const;

type ProofLineProps = {
    /** Horizontal alignment: centred on mobile in both cases, left from `lg` when `align="start"`. */
    align?: 'start' | 'center';
    className?: string;
};

/**
 * Proof line (Figma 712-23818, extracted from the About hero on 2026-09-22 to serve the « Vendre » hero as well):
 * the three round advisor portraits, five sand stars and the real Google rating + review count (`seo.reviews`).
 * Renders nothing without real figures (rule « real numbers only »). Nothing interactive.
 */
export default function ProofLine({ align = 'center', className }: ProofLineProps) {
    const { t, tc } = useTranslation();
    const { seo } = usePage<SharedData>().props;
    const reviews = seo.reviews;

    if (!reviews) return null;

    return (
        <div className={cn('flex items-center justify-center gap-4', align === 'start' && 'lg:justify-start', className)}>
            <ul role="list" aria-label={t('footer.advisors')} className="flex -space-x-3">
                {ADVISORS.map((a) => (
                    <li key={a.id}>
                        <Avatar className="ring-card size-11 ring-2">
                            <AvatarImage src={`/images/advisors/advisor-${a.id}.webp`} alt="" loading="lazy" />
                            <AvatarFallback className="bg-background-10 text-foreground text-xs font-medium">{a.initials}</AvatarFallback>
                        </Avatar>
                    </li>
                ))}
            </ul>
            <div className="flex flex-col items-start gap-1">
                <span aria-hidden className="text-secondary-60 flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className="size-4 fill-current" strokeWidth={0} />
                    ))}
                </span>
                <p className="text-muted-foreground text-sm">
                    <span className="text-foreground font-semibold tabular-nums">{reviews.rating.toLocaleString('fr-FR')}/5</span>{' '}
                    {tc('testimonials.based_on', reviews.count, { count: reviews.count.toLocaleString('fr-FR') })} Google
                </p>
            </div>
        </div>
    );
}
