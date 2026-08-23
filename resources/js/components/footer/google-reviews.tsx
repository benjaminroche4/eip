import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Star } from 'lucide-react';

type GoogleReviewsProps = { className?: string };

/** Monochrome 5-star rating (filled in foreground, half/quarter via clip-path) + "4,9/5 · 128 avis Google". Hidden when not configured. */
export default function GoogleReviews({ className }: GoogleReviewsProps) {
    const { seo, locale } = usePage<SharedData>().props;
    const { t } = useTranslation();
    const reviews = seo.reviews;
    if (!reviews) return null;

    const rating = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(reviews.rating);

    const stars = (
        <span aria-hidden className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => {
                const fill = Math.max(0, Math.min(1, reviews.rating - i));
                return (
                    <span key={i} className="relative size-3.5">
                        <Star className="text-grey-40 absolute inset-0 size-3.5" />
                        {fill > 0 && (
                            <Star
                                className={cn(
                                    'fill-foreground text-foreground absolute inset-0 size-3.5',
                                    fill < 1 && fill >= 0.5 && '[clip-path:inset(0_50%_0_0)]',
                                    fill < 0.5 && '[clip-path:inset(0_75%_0_0)]',
                                )}
                            />
                        )}
                    </span>
                );
            })}
        </span>
    );

    const content = (
        <>
            {stars}
            <span className="text-foreground text-xs font-medium">{t('footer.reviews', { rating, count: reviews.count })}</span>
        </>
    );

    return reviews.url ? (
        <a
            href={reviews.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('footer.reviews_label')}
            className={cn('focus-ring inline-flex w-fit items-center gap-2 rounded-sm transition-opacity hover:opacity-70', className)}
        >
            {content}
        </a>
    ) : (
        <span className={cn('inline-flex w-fit items-center gap-2', className)}>{content}</span>
    );
}
