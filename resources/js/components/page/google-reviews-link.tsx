import { useTranslation } from '@/hooks/use-translation';
import { linkClass } from '@/lib/hover-surface';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type GoogleReviewsLinkProps = {
    /** `seo.reviews.url`: the Google Business Profile reviews page. Without it the text stays plain. */
    href: string | null;
    className?: string;
    children: ReactNode;
};

/**
 * The « N avis Google » text as a link to the agency's Google reviews (user decision 2026-10-11): opens in a new
 * tab, hover = the site's underline that draws itself (`linkClass`), plain text when the URL is not configured.
 */
export default function GoogleReviewsLink({ href, className, children }: GoogleReviewsLinkProps) {
    const { t } = useTranslation();

    if (!href) return <span className={className}>{children}</span>;

    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cn(linkClass, 'focus-ring hover:text-foreground', className)}>
            {children}
            <span className="sr-only"> {t('footer.new_tab')}</span>
        </a>
    );
}
