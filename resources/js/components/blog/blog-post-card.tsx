import SeoImage from '@/components/seo/seo-image';
import { useTranslation } from '@/hooks/use-translation';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import BlogCategoryPill from './blog-category-pill';
import BlogPostMeta from './blog-post-meta';
import { type BlogPostSummary } from './types';

type BlogPostCardProps = { post: BlogPostSummary };

/**
 * Article card (user decision 2026-09-15, ui.sh variant "Pilule sur la photo" refined): light frame, inset photo with a
 * glass category pill (dot in the category colour) over a soft top shade, author avatar + name · short date, title clamped to two lines,
 * excerpt, then a discreet "read" link with an arrow. Hover = the frame darkens and the photo zooms (no underline on links).
 */
export default function BlogPostCard({ post }: BlogPostCardProps) {
    const { t } = useTranslation();

    return (
        <article className="group border-border hover:border-foreground/40 focus-within:border-foreground/40 flex w-full flex-col border transition-colors duration-300 motion-reduce:transition-none">
            <div className="relative p-2">
                {post.image && (
                    <Link href={post.url} prefetch tabIndex={-1} aria-hidden className="relative block overflow-hidden">
                        <SeoImage
                            src={post.image.url}
                            srcSet={post.image.srcset}
                            sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
                            width={post.image.width}
                            height={post.image.height}
                            alt=""
                            className="aspect-[3/2] w-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
                        />
                        {/* Soft shade so the pill stays readable on a light photo. */}
                        {post.category && (
                            <span className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-black/25 to-transparent" />
                        )}
                    </Link>
                )}
                {post.category && <BlogCategoryPill category={post.category} className="absolute top-4 left-4" />}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5 pt-3">
                <BlogPostMeta post={post} />
                <h2 className="line-clamp-2 text-lg font-medium">
                    <Link href={post.url} prefetch className="focus-ring">
                        {post.title}
                    </Link>
                </h2>
                {post.excerpt && (
                    <p className="text-muted-foreground line-clamp-3 text-base/7 text-pretty sm:line-clamp-2 sm:text-sm/6">{post.excerpt}</p>
                )}
                <Link
                    href={post.url}
                    prefetch
                    className="focus-ring text-muted-foreground group-hover:text-foreground mt-auto inline-flex w-fit items-center gap-1.5 pt-2 text-sm font-medium transition-colors motion-reduce:transition-none"
                >
                    {t('blog.read_article')}
                    <ArrowRight
                        aria-hidden
                        className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    />
                </Link>
            </div>
        </article>
    );
}
