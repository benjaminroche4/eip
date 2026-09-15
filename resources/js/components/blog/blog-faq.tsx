import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useTranslation } from '@/hooks/use-translation';
import { useState } from 'react';
import { type FaqSection } from './types';

type BlogFaqProps = { section: FaqSection };

/**
 * Article FAQ block, styled exactly like the FAQ page (user decision 2026-09-15): h2 + « Tout ouvrir / Tout replier »,
 * then the site accordion (sand block once open, plus → minus icon), first question open by default.
 * Radix renders each question as an <h3>, under this block's h2. Answers are plain Sanity text (line breaks kept).
 */
export default function BlogFaq({ section }: BlogFaqProps) {
    const { t } = useTranslation();
    const items = section.items ?? [];
    const [open, setOpen] = useState<string[]>(items[0] ? [items[0]._key] : []);
    const allOpen = items.length > 0 && open.length === items.length;

    if (items.length === 0) return null;

    return (
        <section id={section._key} className="my-8 flex scroll-mt-24 flex-col gap-8" aria-labelledby={`${section._key}-title`}>
            <div className="flex items-baseline justify-between gap-4">
                <h2 id={`${section._key}-title`} className="text-2xl font-medium tracking-tight">
                    {section.title || t('blog.faq')}
                </h2>
                <button
                    type="button"
                    onClick={() => setOpen(allOpen ? [] : items.map((i) => i._key))}
                    className="focus-ring text-muted-foreground hover:text-foreground shrink-0 rounded-none text-xs"
                >
                    {allOpen ? t('faq.collapse_all') : t('faq.expand_all')}
                </button>
            </div>
            <Accordion type="multiple" value={open} onValueChange={setOpen}>
                {items.map((item) => (
                    <AccordionItem key={item._key} value={item._key}>
                        <AccordionTrigger>{item.question}</AccordionTrigger>
                        <AccordionContent>
                            <p className="whitespace-pre-line">{item.answer}</p>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </section>
    );
}
