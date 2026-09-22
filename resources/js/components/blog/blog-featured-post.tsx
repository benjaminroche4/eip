import BorderShimmer from '@/components/page/border-shimmer';
import SeoImage from '@/components/seo/seo-image';
import { useTranslation } from '@/hooks/use-translation';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import BlogCategoryPill from './blog-category-pill';
import BlogPostMeta from './blog-post-meta';
import { type BlogPostSummary } from './types';

type BlogFeaturedPostProps = { post: BlogPostSummary };

/**
 * Latest article "à la une", after the Relocation in Paris blog list (user decision 2026-09-15): a double card — a sand
 * outer frame carrying the centred « Dernier article » label, then an inner white card with the text column on the left
 * (2/5) and the photo on the right (3/5, first on mobile). Same meta / pill / read link as the article cards.
 */
export default function BlogFeaturedPost({ post }: BlogFeaturedPostProps) {
    const { t } = useTranslation();

    return (
        <article
            aria-labelledby="featured-post-title"
            className="group border-border from-background-08 to-background-05 hover:border-foreground/40 focus-within:border-foreground/40 relative border bg-linear-to-b p-2 transition-colors duration-300 motion-reduce:transition-none"
        >
            {/* Border shimmer lifting the frame (shared with the newsletter card, user decision 2026-09-22) */}
            <BorderShimmer />
            <p className="text-muted-foreground pt-1 pb-2 text-center text-xs font-medium tracking-wider uppercase">{t('blog.featured')}</p>
            <div className="bg-card grid lg:grid-cols-5 lg:gap-4">
                <div className="order-2 flex flex-col gap-4 p-4 lg:order-1 lg:col-span-2 lg:p-6">
                    <BlogPostMeta post={post} />
                    <h2 id="featured-post-title" className="text-xl font-semibold tracking-tight text-balance lg:text-3xl">
                        <Link href={post.url} prefetch className="focus-ring">
                            {post.title}
                        </Link>
                    </h2>
                    {post.excerpt && (
                        <p className="text-muted-foreground line-clamp-2 text-base/7 text-pretty sm:text-sm/6 lg:line-clamp-3">{post.excerpt}</p>
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
                <div className="relative order-1 p-2 lg:order-2 lg:col-span-3">
                    {post.image && (
                        <Link href={post.url} prefetch tabIndex={-1} aria-hidden className="relative block h-full overflow-hidden">
                            <SeoImage
                                src={post.image.url}
                                srcSet={post.image.srcset}
                                sizes="(min-width: 1024px) 40rem, 100vw"
                                width={post.image.width}
                                height={post.image.height}
                                alt=""
                                priority
                                className="aspect-[3/2] size-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none lg:aspect-[4/3]"
                            />
                            {post.category && (
                                <span className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-black/25 to-transparent" />
                            )}
                        </Link>
                    )}
                    {post.category && <BlogCategoryPill category={post.category} className="absolute top-4 left-4" />}
                </div>
            </div>
        </article>
    );
}
