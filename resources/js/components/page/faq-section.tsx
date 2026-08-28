import { type Faq } from '@/lib/json-ld';

type FaqSectionProps = {
    title: string;
    items: Faq[];
    className?: string;
};

/** Visible FAQ (pair it with `faqPage(items)` in <SeoHead jsonLd>): one <dl>, answers in the HTML for crawlers and LLMs. */
export default function FaqSection({ title, items, className }: FaqSectionProps) {
    if (items.length === 0) return null;

    return (
        <section aria-labelledby="faq-title" className={className}>
            <h2 id="faq-title" className="text-2xl font-medium tracking-tight">
                {title}
            </h2>
            <dl className="divide-border mt-6 divide-y">
                {items.map((item) => (
                    <div key={item.question} className="py-5">
                        <dt className="font-medium">{item.question}</dt>
                        <dd className="text-muted-foreground mt-2 text-base/7 sm:text-sm/6">{item.answer}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
