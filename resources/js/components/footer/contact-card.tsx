import { useContactHref } from '@/components/navigation/nav-items';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, Star } from 'lucide-react';

/** Advisor portraits from public/images/advisors/advisor-{1,2,3}.webp; initials are the fallback while loading. */
const ADVISORS = [
    { id: 1, initials: 'AB' },
    { id: 2, initials: 'CD' },
    { id: 3, initials: 'EF' },
] as const;

/**
 * Contact block (the whole block links to the contact page, no border or padding): three overlapping advisor avatars,
 * the availability sentence, then the Google rating line. On hover/focus an arrow slides into the top-right corner and the block lifts 2px.
 */
export default function ContactCard() {
    const { seo, locale } = usePage<SharedData>().props;
    const { t } = useTranslation();
    const href = useContactHref();
    const { phone } = seo.organization;

    if (!phone) return null;

    const rating = seo.reviews
        ? new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(seo.reviews.rating)
        : null;

    return (
        <Link
            href={href}
            prefetch
            className={cn(
                'group focus-ring relative flex flex-col gap-4 rounded-sm',
                'transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 motion-reduce:transition-none',
            )}
        >
            <ArrowUpRight
                aria-hidden
                strokeWidth={1.25}
                className="text-foreground absolute top-0 right-0 size-5 -translate-x-1 translate-y-1 opacity-0 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:transition-none"
            />
            <ul aria-label={t('footer.advisors')} className="flex -space-x-3">
                {ADVISORS.map((a) => (
                    <li key={a.id}>
                        <Avatar className="ring-background-05 size-10 ring-2">
                            <AvatarImage src={`/images/advisors/advisor-${a.id}.webp`} alt="" loading="lazy" />
                            <AvatarFallback className="bg-background-10 text-foreground text-xs font-medium">{a.initials}</AvatarFallback>
                        </Avatar>
                    </li>
                ))}
            </ul>

            <p className="text-foreground text-sm">{t('footer.intro', { phone })}</p>

            {seo.reviews && rating && (
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <Star aria-hidden className="fill-warning text-warning size-3.5" />
                    <span>{t('footer.reviews', { rating, count: seo.reviews.count })}</span>
                </p>
            )}
        </Link>
    );
}
