import { useTranslation } from '@/hooks/use-translation';
import BlogCta from './blog-cta';
import BlogFaq from './blog-faq';
import BlogTable from './blog-table';
import PortableText from './portable-text';
import { type BlogSection } from './types';

type BlogBodyProps = { sections: BlogSection[] };

/** Top-level sections of a Sanity article body, one component per block type. Titled sections carry `id={_key}` for the table of contents (`lib/blog-toc.ts`). Raw styling for now. */
export default function BlogBody({ sections }: BlogBodyProps) {
    return (
        <>
            {sections.map((section) => (
                <Section key={section._key} section={section} />
            ))}
        </>
    );
}

function Section({ section }: { section: BlogSection }) {
    const { t } = useTranslation();

    switch (section._type) {
        case 'quickAnswerBlock':
            return (
                /* Quick answer (GEO), after the Relocation in Paris article page: a sand outer block (p-2) carrying the title, then the text in an inner white card. */
                <aside id={section._key} className="bg-background-08 my-8 scroll-mt-24 p-2" aria-labelledby={`${section._key}-title`}>
                    <h2 id={`${section._key}-title`} className="px-4 py-3 text-lg font-medium tracking-tight sm:px-6">
                        {section.title || t('blog.quick_answer')}
                    </h2>
                    <div className="bg-card p-4 sm:p-6 [&>:first-child]:mt-0 [&>:last-child]:mb-0">
                        <PortableText value={section.content ?? []} />
                    </div>
                </aside>
            );

        case 'wysiwygBlock':
            // `background` (the conclusion / « à retenir » section): same double card as the quick answer, same title size.
            if (section.background) {
                return (
                    <section id={section._key} className="bg-background-08 my-8 scroll-mt-24 p-2">
                        {section.title && <h2 className="px-4 py-3 text-lg font-medium tracking-tight sm:px-6">{section.title}</h2>}
                        <div className="bg-card p-4 sm:p-6 [&>:first-child]:mt-0 [&>:last-child]:mb-0">
                            <PortableText value={section.content ?? []} />
                        </div>
                    </section>
                );
            }
            return (
                <section id={section._key} className="my-8 scroll-mt-24 [&>:first-child]:mt-0">
                    {section.title && <h2 className="mb-4 text-2xl font-medium tracking-tight">{section.title}</h2>}
                    <PortableText value={section.content ?? []} />
                </section>
            );

        case 'tableBlock':
            return <BlogTable section={section} />;

        case 'ctaBlock':
            return <BlogCta section={section} />;

        case 'faqBlock':
            return <BlogFaq section={section} />;

        default:
            return null;
    }
}
