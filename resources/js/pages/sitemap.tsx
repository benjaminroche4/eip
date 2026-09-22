import PageEyebrow from '@/components/page/page-eyebrow';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { linkClass } from '@/lib/hover-surface';
import { breadcrumbList, itemList } from '@/lib/json-ld';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';

type SitemapLink = { label: string; href: string };
type SitemapGroup = { title: string; links: SitemapLink[] };
type SitemapCategory = SitemapLink & { posts: SitemapLink[] };
type SitemapProps = { groups: SitemapGroup[]; blog: { categories: SitemapCategory[]; other: SitemapLink[] } };

/** Count pill next to a group title (the category filter's badge); screen readers get « , N liens ». */
const Count = ({ n, label }: { n: number; label: string }) => (
    <>
        <span className="sr-only">, {label}</span>
        <span aria-hidden className="bg-background-08 rounded-full px-2 py-0.5 text-xs font-normal tabular-nums">
            {n}
        </span>
    </>
);

/** Rows of links: full width, hairline between, sand hover kept inside the row (`px-3`, no negative margin — user decision 2026-09-22). */
const Rows = ({ links }: { links: SitemapLink[] }) => (
    <ul role="list" className="flex flex-col">
        {links.map((link) => (
            <li key={link.href} className="border-border border-b last:border-b-0">
                <Link
                    href={link.href}
                    prefetch
                    className="focus-ring group hover:bg-background-05 flex items-center justify-between gap-4 rounded-none px-3 py-3 text-base transition-colors duration-300 motion-reduce:transition-none"
                >
                    {link.label}
                    <ArrowUpRight
                        aria-hidden
                        className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-[color,translate] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-0"
                    />
                </Link>
            </li>
        ))}
    </ul>
);

/**
 * « Plan du site » (2026-09-22, replaces the former terms page): the site's page header (eyebrow + h1 + answer-first
 * intro), then one `<nav>` landmark holding a `<section>` per group — the three page groups (services, site pages,
 * legal) and the blog, whose articles are grouped by category (h3 = link to the category page), the uncategorised
 * ones last. ui.sh variant « Éditorial » chosen among 16 (user decision 2026-09-22): h2 at the legal pages' size
 * (`text-xl font-medium`) with a count pill, rows separated by hairlines, sand hover inside the row, `ArrowUpRight`
 * darkening and sliding. JSON-LD: breadcrumb + `ItemList` of every link (the page is an index, say so to engines).
 */
export default function Sitemap({ groups, blog }: SitemapProps) {
    const { t, tc } = useTranslation();
    const { ziggy } = usePage<SharedData>().props;
    const origin = new URL(ziggy.location).origin;
    const crumbs = [
        { name: t('nav.home'), url: route('home') },
        { name: t('pages.sitemap.title'), url: route('sitemap') },
    ];
    const blogLinks = [...blog.categories.flatMap((c) => [c, ...c.posts]), ...blog.other];
    const blogCount = blog.categories.reduce((n, c) => n + c.posts.length, 0) + blog.other.length;
    const every = [...groups.flatMap((g) => g.links), ...blogLinks].map((l) => ({ name: l.label, url: l.href }));

    return (
        <>
            <SeoHead
                title={t('pages.sitemap.seo_title')}
                description={t('pages.sitemap.seo_description')}
                jsonLd={[breadcrumbList(crumbs, origin), itemList(every)]}
            />
            <PublicLayout className="max-w-5xl">
                <div className="flex flex-col gap-12 lg:gap-16">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <PageEyebrow>{t('pages.sitemap.title')}</PageEyebrow>
                        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t('pages.sitemap.headline')}</h1>
                        <p className="text-muted-foreground max-w-2xl text-base/7 text-pretty sm:text-sm/6">{t('pages.sitemap.intro')}</p>
                    </div>
                    <nav aria-label={t('pages.sitemap.title')} className="flex flex-col gap-14">
                        {groups.map((group, i) => (
                            <section key={group.title} aria-labelledby={`sitemap-group-${i}`} className="flex flex-col gap-4">
                                <h2 id={`sitemap-group-${i}`} className="flex items-center gap-3 text-xl font-medium">
                                    {group.title}
                                    <Count
                                        n={group.links.length}
                                        label={tc('pages.sitemap.links_count', group.links.length, { count: String(group.links.length) })}
                                    />
                                </h2>
                                <Rows links={group.links} />
                            </section>
                        ))}
                        {blogCount > 0 && (
                            <section aria-labelledby="sitemap-blog" className="flex flex-col gap-8">
                                <h2 id="sitemap-blog" className="flex items-center gap-3 text-xl font-medium">
                                    {t('pages.sitemap.blog_posts')}
                                    <Count n={blogCount} label={tc('pages.sitemap.links_count', blogCount, { count: String(blogCount) })} />
                                </h2>
                                {blog.categories.map((category) => (
                                    <div key={category.href} className="flex flex-col gap-3">
                                        {/* The category title links to the category page (indexable listing) */}
                                        <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                            <Link href={category.href} prefetch className={cn('focus-ring rounded-none', linkClass)}>
                                                {category.label}
                                            </Link>
                                        </h3>
                                        <Rows links={category.posts} />
                                    </div>
                                ))}
                                {blog.other.length > 0 && (
                                    <div className="flex flex-col gap-3">
                                        <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                            {t('pages.sitemap.blog_other')}
                                        </h3>
                                        <Rows links={blog.other} />
                                    </div>
                                )}
                            </section>
                        )}
                    </nav>
                </div>
            </PublicLayout>
        </>
    );
}
