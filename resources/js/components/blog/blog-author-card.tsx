import { useTranslation } from '@/hooks/use-translation';
import { formatDate } from '@/lib/format-date';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { CalendarDays, Clock, RefreshCw } from 'lucide-react';
import { type ReactNode } from 'react';
import BlogSideCard from './blog-side-card';
import { type BlogPost } from './types';

type BlogAuthorCardProps = { post: BlogPost };

/**
 * Author + dates + read time of an article, in a side card under the table of contents (user decision 2026-09-15,
 * ui.sh variant « Lignes à icônes »): avatar + name, then one row per fact with a lucide icon (calendar, refresh, clock).
 */
export default function BlogAuthorCard({ post }: BlogAuthorCardProps) {
    const { t } = useTranslation();
    const { locale, seo } = usePage<SharedData>().props;
    const author = post.authors[0];
    const updated = post.updated_at && post.updated_at.slice(0, 10) !== post.published_at.slice(0, 10);

    const row = (label: string, value: ReactNode, icon: ReactNode) => (
        <div className="flex justify-between gap-3">
            <dt className="flex items-center gap-1.5">
                {icon}
                {label}
            </dt>
            <dd className="text-foreground">{value}</dd>
        </div>
    );

    return (
        <BlogSideCard aria-labelledby="article-author-title" role="group">
            <div className="flex items-center gap-3">
                {author?.photo && (
                    <img src={author.photo} alt="" width={48} height={48} loading="lazy" className="size-12 shrink-0 rounded-full object-cover" />
                )}
                <p id="article-author-title" className="text-foreground truncate font-medium">
                    <span className="sr-only">{t('blog.by_label')}</span> {author?.name ?? seo.organization.name}
                </p>
            </div>
            <dl className="text-muted-foreground flex flex-col gap-2 text-xs">
                {row(
                    t('blog.published_label'),
                    <time dateTime={post.published_at}>{formatDate(post.published_at, locale)}</time>,
                    <CalendarDays aria-hidden className="size-3.5 shrink-0" />,
                )}
                {updated &&
                    row(
                        t('blog.updated_label'),
                        <time dateTime={post.updated_at}>{formatDate(post.updated_at, locale)}</time>,
                        <RefreshCw aria-hidden className="size-3.5 shrink-0" />,
                    )}
                {post.read_time
                    ? row(
                          t('blog.read_time_label'),
                          t('blog.read_time', { minutes: post.read_time }),
                          <Clock aria-hidden className="size-3.5 shrink-0" />,
                      )
                    : null}
            </dl>
        </BlogSideCard>
    );
}
