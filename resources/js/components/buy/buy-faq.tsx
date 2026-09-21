import FaqAnswer from '@/components/faq/faq-answer';
import PageEyebrow from '@/components/page/page-eyebrow';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useTranslation } from '@/hooks/use-translation';
import { linkClass } from '@/lib/hover-surface';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';

export type BuyFaq = {
    /** Slug of the « buying » topic on the FAQ page (URL anchor). */
    slug: string;
    items: { question: string; answer: string; slug: string }[];
};

type BuyFaqProps = { faq: BuyFaq };

/**
 * FAQ block of the « Acheter » page, just before the closing CTA (user decision 2026-09-21): two columns on desktop
 * like the About values — the header (eyebrow, h2, answer-first intro) and the link to the FAQ topic on the left,
 * sticky, the site accordion on the right (same as the FAQ page and the blog: sand block once open, plus →
 * minus icon, first question open, « Tout ouvrir / Tout replier ») on the first six « buying » questions of the FAQ
 * page — one source of truth in `ui.faq.categories`, sliced by the controller. Answers keep the FAQ's `[label](route)` link markup. The page emits the matching FAQPage JSON-LD.
 */
export default function BuyFaq({ faq }: BuyFaqProps) {
    const { t } = useTranslation();
    const items = faq.items;
    const [open, setOpen] = useState<string[]>(items[0] ? [items[0].slug] : []);
    const allOpen = items.length > 0 && open.length === items.length;

    if (items.length === 0) return null;

    return (
        <section aria-labelledby="buy-faq-title" className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-24">
            {/* Left column: header + link to the FAQ topic, sticky on desktop like the About values */}
            <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
                <div className="flex flex-col gap-4">
                    <PageEyebrow>{t('buy.faq.eyebrow')}</PageEyebrow>
                    <h2 id="buy-faq-title" className="max-w-md text-2xl font-medium tracking-tight text-balance sm:text-3xl">
                        {t('buy.faq.title')}
                    </h2>
                    {/* GEO: a self-contained sentence (brand + what + where) */}
                    <p className="text-muted-foreground max-w-md text-base/7 text-pretty sm:text-sm/6">{t('buy.faq.intro')}</p>
                </div>
                <Link href={`${route('faq')}#${faq.slug}`} prefetch className={`${linkClass} inline-flex w-fit items-center gap-1.5 text-sm`}>
                    {t('buy.faq.all')}
                    <ArrowRight aria-hidden className="size-4" />
                </Link>
            </div>

            {/* Right column: the accordion */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setOpen(allOpen ? [] : items.map((i) => i.slug))}
                        className="focus-ring text-muted-foreground hover:text-foreground rounded-none text-xs"
                    >
                        {allOpen ? t('faq.collapse_all') : t('faq.expand_all')}
                    </button>
                </div>
                <Accordion type="multiple" value={open} onValueChange={setOpen}>
                    {items.map((item) => (
                        <AccordionItem key={item.slug} value={item.slug}>
                            <AccordionTrigger>{item.question}</AccordionTrigger>
                            <AccordionContent>
                                <p>
                                    <FaqAnswer text={item.answer} />
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
