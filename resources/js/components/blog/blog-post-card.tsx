import SeoImage from '@/components/seo/seo-image';
import { useTranslation } from '@/hooks/use-translation';
import { formatDate } from '@/lib/format-date';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type BlogPostSummary } from './types';

type BlogPostCardProps = { post: BlogPostSummary };

export default function BlogPostCard({ post }: BlogPostCardProps) {
    const { t } = useTranslation();
    const { locale } = usePage<SharedData>().props;

    return (
        <article className="flex flex-col gap-3">
            {post.image && (
                <Link href={post.url} prefetch tabIndex={-1} aria-hidden>
                    <SeoImage
                        src={post.image.url}
                        srcSet={post.image.srcset}
                        sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
                        width={post.image.width}
                        height={post.image.height}
                        alt=""
                        className="aspect-[3/2] w-full object-cover"
                    />
                </Link>
            )}
            <p className="text-muted-foreground text-sm">
                {post.category && <span>{post.category.name} · </span>}
                <time dateTime={post.published_at}>{formatDate(post.published_at, locale)}</time>
                {post.read_time ? <span> · {t('blog.read_time', { minutes: post.read_time })}</span> : null}
            </p>
            <h2 className="text-xl font-medium">
                <Link href={post.url} prefetch className="focus-ring hover:underline">
                    {post.title}
                </Link>
            </h2>
            {post.excerpt && <p className="text-muted-foreground text-base/7 sm:text-sm/6">{post.excerpt}</p>}
        </article>
    );
}
