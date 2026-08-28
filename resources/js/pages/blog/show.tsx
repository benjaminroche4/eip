import BlogBody from '@/components/blog/blog-body';
import { type BlogPost } from '@/components/blog/types';
import SeoBreadcrumbs from '@/components/seo/seo-breadcrumbs';
import SeoHead, { type JsonLd } from '@/components/seo/seo-head';
import SeoImage from '@/components/seo/seo-image';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { formatDate } from '@/lib/format-date';
import { linkClass } from '@/lib/hover-surface';
import { article, breadcrumbList, faqPage } from '@/lib/json-ld';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

type Props = {
    post: BlogPost;
    /** hreflang map (only real translations + x-default) — overrides the shared localization alternates. */
    alternates: Record<string, string>;
};

export default function BlogShow({ post, alternates }: Props) {
    const { t } = useTranslation();
    const { ziggy, locale, seo } = usePage<SharedData>().props;
    const origin = new URL(ziggy.location).origin;
    const crumbs = [
        { name: t('nav.home'), url: route('home') },
        { name: t('blog.title'), url: route('blog.index') },
        { name: post.title, url: post.url },
    ];
    const author = post.authors[0]?.name ?? seo.organization.name;
    const jsonLd: JsonLd[] = [
        article({
            headline: post.title,
            description: post.seo_description,
            url: post.url,
            image: post.image?.url,
            datePublished: post.published_at,
            dateModified: post.updated_at,
            authorName: author,
            publisherId: `${origin}/#organization`,
        }),
        breadcrumbList(crumbs, origin),
    ];
    if (post.faqs.length >= 3) jsonLd.push(faqPage(post.faqs));

    return (
        <>
            <SeoHead
                title={post.seo_title}
                description={post.seo_description}
                canonical={post.url}
                image={post.image?.url}
                imageAlt={post.image?.alt}
                type="article"
                article={{ publishedTime: post.published_at, modifiedTime: post.updated_at, author, section: post.category?.name, tags: post.tags }}
                alternates={alternates}
                jsonLd={jsonLd}
            />
            <PublicLayout className="max-w-3xl">
                <SeoBreadcrumbs crumbs={crumbs} />
                <article>
                    <header className="mt-4">
                        {post.category && <p className="text-muted-foreground text-sm">{post.category.name}</p>}
                        <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">{post.title}</h1>
                        {post.excerpt && <p className="mt-4 text-lg/8">{post.excerpt}</p>}
                        <p className="text-muted-foreground mt-4 text-sm">
                            {t('blog.by', { author })} · {t('blog.published_on', { date: formatDate(post.published_at, locale) })}
                            {post.updated_at && post.updated_at.slice(0, 10) !== post.published_at.slice(0, 10) && (
                                <> · {t('blog.updated_on', { date: formatDate(post.updated_at, locale) })}</>
                            )}
                            {post.read_time ? <> · {t('blog.read_time', { minutes: post.read_time })}</> : null}
                        </p>
                        {post.image && (
                            <SeoImage
                                priority
                                src={post.image.url}
                                srcSet={post.image.srcset}
                                sizes="(min-width: 768px) 48rem, 100vw"
                                width={post.image.width}
                                height={post.image.height}
                                alt={post.image.alt}
                                className="mt-8 h-auto w-full"
                            />
                        )}
                    </header>

                    <BlogBody sections={post.body} />

                    {post.tags.length > 0 && (
                        <footer className="border-border mt-10 border-t pt-6">
                            <p className="text-muted-foreground text-sm">
                                <span className="font-medium">{t('blog.tags')} : </span>
                                {post.tags.join(', ')}
                            </p>
                        </footer>
                    )}
                </article>

                <p className="mt-10">
                    <Link href={route('blog.index')} prefetch className={cn('focus-ring', linkClass)}>
                        {t('blog.back')}
                    </Link>
                </p>
            </PublicLayout>
        </>
    );
}
