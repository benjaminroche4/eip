import BlogAuthorCard from '@/components/blog/blog-author-card';
import BlogBody from '@/components/blog/blog-body';
import BlogCategoryPill from '@/components/blog/blog-category-pill';
import BlogRelated from '@/components/blog/blog-related';
import BlogSideCard from '@/components/blog/blog-side-card';
import BlogTags from '@/components/blog/blog-tags';
import BlogToc from '@/components/blog/blog-toc';
import ReadingProgress from '@/components/blog/reading-progress';
import { type BlogPost, type BlogPostSummary } from '@/components/blog/types';
import GradientHairline from '@/components/layout/gradient-hairline';
import PageEyebrow from '@/components/page/page-eyebrow';
import SeoBreadcrumbs from '@/components/seo/seo-breadcrumbs';
import SeoHead, { type JsonLd } from '@/components/seo/seo-head';
import SeoImage from '@/components/seo/seo-image';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { blogToc } from '@/lib/blog-toc';
import { article, breadcrumbList, faqPage, organizationNode } from '@/lib/json-ld';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useRef } from 'react';

type Props = {
    post: BlogPost;
    /** Up to three other articles (same category first) for « À lire aussi ». */
    related: BlogPostSummary[];
    /** hreflang map (only real translations + x-default) — overrides the shared localization alternates. */
    alternates: Record<string, string>;
};

/**
 * Article page (user decision 2026-09-15): `max-w-6xl`, breadcrumb top-left, then the same centred header as the listing
 * (eyebrow = category, h1, excerpt as intro), the main photo full width (no frame, no caption: the description stays in the alt), and the text in two
 * columns on desktop (reading progress hairline fixed at the top) — sticky side cards on the left (table of contents, then author · dates · read time, framed like the valuation recap), body on the right.
 */
export default function BlogShow({ post, related, alternates }: Props) {
    const { t } = useTranslation();
    const { ziggy, seo } = usePage<SharedData>().props;
    const articleRef = useRef<HTMLElement>(null);
    const origin = new URL(ziggy.location).origin;
    const crumbs = [
        { name: t('nav.home'), url: route('home') },
        { name: t('blog.breadcrumb'), url: route('blog.index') },
        { name: post.title, url: post.url },
    ];
    const author = post.authors[0]?.name ?? seo.organization.name;
    const toc = blogToc(post.body, t('blog.faq'));
    const jsonLd: JsonLd[] = [
        article({
            headline: post.title,
            description: post.seo_description,
            url: post.url,
            image: post.image ? { url: post.image.url, width: post.image.width, height: post.image.height } : undefined,
            datePublished: post.published_at,
            dateModified: post.updated_at,
            authorName: author,
            authorImage: post.authors[0]?.photo,
            publisherId: `${origin}/#organization`,
            inLanguage: seo.locale.replace('_', '-'),
            section: post.category?.name,
            keywords: post.tags,
            wordCount: post.word_count,
        }),
        organizationNode(seo, origin), // resolves the publisher / worksFor references on this page
        breadcrumbList(crumbs, origin),
    ];
    if (post.faqs.length >= 3) jsonLd.push(faqPage(post.faqs));

    return (
        <>
            <SeoHead
                title={post.seo_title}
                withSuffix={post.seo_title_suffix}
                description={post.seo_description}
                canonical={post.url}
                image={post.image?.url}
                imageAlt={post.image?.alt}
                type="article"
                article={{ publishedTime: post.published_at, modifiedTime: post.updated_at, author, section: post.category?.name, tags: post.tags }}
                alternates={alternates}
                jsonLd={jsonLd}
            />
            <PublicLayout className="max-w-6xl">
                {/* Pulled up into the layout's top padding so the crumb hugs the header (user decision 2026-09-15). */}
                <div className="-mt-6 sm:-mt-8 lg:-mt-12">
                    <SeoBreadcrumbs crumbs={crumbs} />
                </div>
                <ReadingProgress target={articleRef} />
                <article ref={articleRef} className="mt-10 flex flex-col gap-12 lg:gap-16">
                    <header className="flex flex-col items-center gap-3 text-center">
                        <div className="flex flex-col items-center gap-3">
                            {post.category ? <BlogCategoryPill category={post.category} /> : <PageEyebrow>{t('blog.title')}</PageEyebrow>}
                            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{post.title}</h1>
                        </div>
                        {post.excerpt && <p className="text-muted-foreground max-w-2xl text-base/7 text-pretty sm:text-sm/6">{post.excerpt}</p>}
                    </header>

                    {/* Main photo: edge to edge on mobile like the Sell page's first photo (`-mx-6`, user decision 2026-09-22), 16/9 there and 2/1 from lg */}
                    {post.image && (
                        <div className="-mx-6 lg:mx-0">
                            <SeoImage
                                priority
                                src={post.image.url}
                                srcSet={post.image.srcset}
                                sizes="(min-width: 1152px) 72rem, 100vw"
                                width={post.image.width}
                                height={post.image.height}
                                alt={post.image.alt}
                                className="aspect-video w-full object-cover lg:aspect-[2/1]"
                            />
                        </div>
                    )}

                    <div className="grid gap-10 lg:grid-cols-3 lg:gap-16">
                        <div className="flex flex-col gap-4 self-start lg:sticky lg:top-24 lg:col-span-1">
                            {toc.length > 0 && (
                                <BlogSideCard>
                                    <BlogToc entries={toc} />
                                </BlogSideCard>
                            )}
                            <BlogAuthorCard post={post} />
                        </div>
                        {/* The first section drops its top margin so the body starts level with the side cards. */}
                        <div className="max-w-prose min-w-0 lg:col-span-2 [&>:first-child]:mt-0">
                            <BlogBody sections={post.body} />

                            <footer className="mt-12 flex flex-col gap-6">
                                <GradientHairline />
                                <BlogTags tags={post.tags} />
                            </footer>
                        </div>
                    </div>
                </article>

                {related.length > 0 && (
                    <div className="mt-16 lg:mt-24">
                        <BlogRelated posts={related} />
                    </div>
                )}
            </PublicLayout>
        </>
    );
}
