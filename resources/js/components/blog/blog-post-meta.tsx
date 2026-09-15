import { useTranslation } from '@/hooks/use-translation';
import { formatDate } from '@/lib/format-date';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { type BlogPostSummary } from './types';

type BlogPostMetaProps = { post: BlogPostSummary; className?: string };

/** Author avatar + name · short date (shared by the card and the featured post). Falls back to the agency name without author. */
export default function BlogPostMeta({ post, className }: BlogPostMetaProps) {
    const { t } = useTranslation();
    const { locale, seo } = usePage<SharedData>().props;
    const author = post.authors[0];

    return (
        <p className={cn('text-muted-foreground flex items-center gap-2 text-xs', className)}>
            {author?.photo && (
                <img src={author.photo} alt="" width={24} height={24} loading="lazy" className="size-6 shrink-0 rounded-full object-cover" />
            )}
            <span className="text-foreground font-medium">
                <span className="sr-only">{t('blog.by_label')} </span>
                {author?.name ?? seo.organization.name}
            </span>
            <span aria-hidden className="bg-muted-foreground size-1 shrink-0 rounded-full" />
            <time dateTime={post.published_at}>{formatDate(post.published_at, locale, 'short')}</time>
        </p>
    );
}
