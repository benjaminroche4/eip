import BlogPostCard from '@/components/blog/blog-post-card';
import { type BlogPostSummary } from '@/components/blog/types';
import SeoBreadcrumbs from '@/components/seo/seo-breadcrumbs';
import SeoHead from '@/components/seo/seo-head';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { breadcrumbList, itemList } from '@/lib/json-ld';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

type Props = {
    posts: { data: BlogPostSummary[]; total: number; current_page: number; last_page: number };
    indexing: { noindex: boolean; prev: string | null; next: string | null };
};

export default function BlogIndex({ posts, indexing }: Props) {
    const { t, tc } = useTranslation();
    const { ziggy } = usePage<SharedData>().props;
    const origin = new URL(ziggy.location).origin;
    const crumbs = [
        { name: t('nav.home'), url: route('home') },
        { name: t('blog.title'), url: route('blog.index') },
    ];
    const title = posts.current_page > 1 ? t('blog.title_page', { page: posts.current_page }) : t('blog.seo_title');

    return (
        <>
            <SeoHead
                title={title}
                description={t('blog.seo_description')}
                canonical={posts.current_page > 1 ? route('blog.index', { page: posts.current_page }) : route('blog.index')}
                noindex={indexing.noindex}
                prev={indexing.prev}
                next={indexing.next}
                jsonLd={[
                    { '@type': 'CollectionPage', name: title, url: route('blog.index') },
                    breadcrumbList(crumbs, origin),
                    itemList(posts.data.map((p) => ({ name: p.title, url: p.url }))),
                ]}
            />
            <PublicLayout className="max-w-6xl">
                <SeoBreadcrumbs crumbs={crumbs} />
                <h1 className="mt-4 text-3xl font-medium tracking-tight">{t('blog.title')}</h1>
                <p className="mt-3 max-w-3xl text-base/7">{t('blog.intro')}</p>
                <p className="text-muted-foreground mt-4 text-sm">{tc('blog.count', posts.total)}</p>

                {posts.data.length === 0 ? (
                    <p className="text-muted-foreground py-10 text-center">{t('blog.empty')}</p>
                ) : (
                    <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.data.map((post) => (
                            <BlogPostCard key={post.id} post={post} />
                        ))}
                    </div>
                )}

                {posts.last_page > 1 && (
                    <nav className="mt-12 flex items-center justify-between" aria-label="Pagination">
                        {indexing.prev ? (
                            <Button asChild variant="outline">
                                <Link href={indexing.prev}>{t('blog.previous')}</Link>
                            </Button>
                        ) : (
                            <span />
                        )}
                        <span className="text-muted-foreground text-sm">
                            {t('blog.page_of', { current: posts.current_page, last: posts.last_page })}
                        </span>
                        {indexing.next ? (
                            <Button asChild variant="outline">
                                <Link href={indexing.next}>{t('blog.next')}</Link>
                            </Button>
                        ) : (
                            <span />
                        )}
                    </nav>
                )}
            </PublicLayout>
        </>
    );
}
