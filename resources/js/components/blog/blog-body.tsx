import { useContactHref } from '@/components/navigation/nav-items';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import PortableText from './portable-text';
import { type BlogSection } from './types';

type BlogBodyProps = { sections: BlogSection[] };

/** Top-level sections of a Sanity article body, one component per block type. Raw styling for now. */
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
    const contactHref = useContactHref();

    switch (section._type) {
        case 'quickAnswerBlock':
            return (
                <aside className="bg-muted my-8 p-6" aria-labelledby={`${section._key}-title`}>
                    {section.title && (
                        <h2 id={`${section._key}-title`} className="mb-2 text-xl font-medium">
                            {section.title}
                        </h2>
                    )}
                    <PortableText value={section.content ?? []} />
                </aside>
            );

        case 'wysiwygBlock':
            return (
                <section className={section.background ? 'bg-muted my-8 p-6' : 'my-8'}>
                    {section.title && <h2 className="mb-4 text-2xl font-medium">{section.title}</h2>}
                    <PortableText value={section.content ?? []} />
                </section>
            );

        case 'tableBlock': {
            const rows = section.table?.rows ?? [];
            if (rows.length === 0) return null;
            const [head, ...body] = section.firstRowIsHeader ? rows : [null, ...rows];
            return (
                <div className="my-8 overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        {section.caption && <caption className="text-muted-foreground mb-2 text-left text-sm">{section.caption}</caption>}
                        {head && (
                            <thead>
                                <tr>
                                    {head.cells.map((c, i) => (
                                        <th key={i} scope="col" className="border-border border p-2 text-left font-medium">
                                            {c}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                        )}
                        <tbody>
                            {body.map((row) => (
                                <tr key={row!._key}>
                                    {row!.cells.map((c, i) =>
                                        section.firstColumnIsHeader && i === 0 ? (
                                            <th key={i} scope="row" className="border-border border p-2 text-left font-medium">
                                                {c}
                                            </th>
                                        ) : (
                                            <td key={i} className="border-border border p-2 align-top">
                                                {c}
                                            </td>
                                        ),
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        case 'ctaBlock':
            return (
                <aside className="bg-primary text-primary-foreground my-8 p-6">
                    {section.title && <p className="text-xl font-medium">{section.title}</p>}
                    {section.description && <p className="mt-2 text-base/7">{section.description}</p>}
                    <Button asChild variant="neutral" size="lg" className="mt-4">
                        <a href={contactHref}>{section.btnText || t('blog.cta_default')}</a>
                    </Button>
                </aside>
            );

        case 'faqBlock':
            if (!section.items?.length) return null;
            return (
                <section className="my-8" aria-labelledby={`${section._key}-title`}>
                    <h2 id={`${section._key}-title`} className="mb-4 text-2xl font-medium">
                        {section.title || t('blog.faq')}
                    </h2>
                    <dl className="divide-border divide-y">
                        {section.items.map((item) => (
                            <div key={item._key} className="py-4">
                                <dt className="font-medium">{item.question}</dt>
                                <dd className="text-muted-foreground mt-2 text-base/7">{item.answer}</dd>
                            </div>
                        ))}
                    </dl>
                </section>
            );

        default:
            return null;
    }
}
