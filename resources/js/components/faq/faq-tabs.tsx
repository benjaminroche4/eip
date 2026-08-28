import FaqAnswer from '@/components/faq/faq-answer';
import FaqCta from '@/components/faq/faq-cta';
import FaqSearch from '@/components/faq/faq-search';
import { type FaqCategory, type FaqItem } from '@/components/faq/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useTranslation } from '@/hooks/use-translation';
import { stripFaqMarkup } from '@/lib/faq-markup';
import { cn } from '@/lib/utils';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { useEffect, useMemo, useRef, useState } from 'react';

type FaqTabsProps = { categories: FaqCategory[] };

/** Accent- and case-insensitive "contains". */
const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * FAQ by topic (Figma 696-10782 desktop / 696-10837 mobile). Radix Tabs for the semantics and the keyboard
 * (arrows between topics, the panel is the accordion) — a sticky column of topics on the left in desktop, the
 * same rows in a horizontally scrollable, snapping strip on mobile.
 *
 * On top of the design: a search over every question, sitting above the topics (results take the panel, topics dimmed; none → contact CTA; picking a topic clears it), one URL
 * anchor per topic and per question (`#slug`, restored on load, kept in sync while browsing), open questions
 * remembered per topic, "expand all" per topic, and a contact CTA at the end of each topic.
 * Every category's questions are in the HTML (`forceMount`, inactive panels `hidden`), so crawlers see the whole FAQ.
 */
export default function FaqTabs({ categories }: FaqTabsProps) {
    const { t } = useTranslation();
    const [active, setActive] = useState(categories[0]?.key ?? '');
    // Open questions, per topic — the first one by default; switching topics and back keeps what was open.
    const [open, setOpen] = useState<Record<string, string[]>>(() =>
        Object.fromEntries(categories.map((c) => [c.key, c.items[0] ? [c.items[0].slug] : []])),
    );
    const [query, setQuery] = useState('');
    const list = useRef<HTMLDivElement>(null);
    const searchId = 'faq-search';

    // Deep link: #topic-slug or #question-slug opens the right topic (and question) and scrolls to it.
    useEffect(() => {
        const slug = window.location.hash.slice(1);
        if (!slug) return;
        const byQuestion = categories.find((c) => c.items.some((i) => i.slug === slug));
        const category = byQuestion ?? categories.find((c) => c.slug === slug);
        if (!category) return;
        setActive(category.key);
        if (byQuestion) setOpen((o) => ({ ...o, [category.key]: [...new Set([...(o[category.key] ?? []), slug])] }));
        window.requestAnimationFrame(() => document.getElementById(slug)?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
    }, [categories]);

    // Keep the selected tab in view (mobile strip) when it changes from the keyboard or a tap near the edge.
    useEffect(() => {
        list.current?.querySelector<HTMLElement>('[data-state="active"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }, [active]);

    /** Shareable URL: the last opened question, else the topic — without adding history entries. */
    const syncHash = (slug: string) => window.history.replaceState(window.history.state, '', `#${slug}`);

    const selectTopic = (key: string) => {
        setQuery('');
        setActive(key);
        const category = categories.find((c) => c.key === key);
        if (category) syncHash(category.slug);
    };

    const setOpenFor = (category: FaqCategory, values: string[]) => {
        setOpen((o) => ({ ...o, [category.key]: values }));
        const last = values.find((v) => !(open[category.key] ?? []).includes(v));
        syncHash(last ?? category.slug);
    };

    const results = useMemo(() => {
        const q = normalize(query.trim());
        if (q.length < 2) return null;
        return categories.flatMap((category) =>
            category.items
                .filter((item) => normalize(item.question).includes(q) || normalize(stripFaqMarkup(item.answer)).includes(q))
                .map((item) => ({ item, category })),
        );
    }, [query, categories]);

    if (categories.length === 0) return null;

    return (
        <TabsPrimitive.Root value={active} onValueChange={selectTopic} orientation="vertical" className="flex flex-col gap-7 lg:flex-row lg:gap-16">
            {/* Topics column — search on top, then the topics. Mobile: the strip scrolls and fades out on the right; desktop: sticky */}
            <div className="flex shrink-0 flex-col gap-5 lg:sticky lg:top-24 lg:w-72 lg:self-start">
                {/* Search over every question of every topic */}
                <FaqSearch id={searchId} value={query} onChange={setQuery} count={results ? results.length : null} />

                <div className="relative -mx-4 sm:mx-0">
                    <TabsPrimitive.List
                        ref={list}
                        aria-label={t('faq.categories_label')}
                        className="flex snap-x gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:px-0 lg:flex-col lg:gap-0.5 lg:overflow-visible"
                    >
                        {categories.map((category) => (
                            <TabsPrimitive.Trigger
                                key={category.key}
                                value={category.key}
                                data-searching={results ? '' : undefined}
                                className={cn(
                                    // One style everywhere: square rows on the accordion surfaces (sand once active, light sand on hover),
                                    // colour only — never weight. Mobile: a scrolling strip; desktop: full-width rows. Dimmed while searching.
                                    'group focus-ring flex shrink-0 snap-start scroll-mx-4 items-center gap-3 rounded-none px-4 py-3 text-left text-sm whitespace-nowrap',
                                    'text-muted-foreground data-[state=active]:text-foreground',
                                    'data-[state=active]:bg-background-08 data-[state=inactive]:hover:bg-background-05',
                                    'data-searching:text-muted-foreground data-searching:bg-transparent',
                                    'lg:w-full lg:gap-4 lg:whitespace-normal',
                                )}
                            >
                                <span className="lg:flex-1">{category.title}</span>
                                {/* Number of questions in the topic (decorative) */}
                                <span aria-hidden className="text-muted-foreground text-xs tabular-nums">
                                    {String(category.items.length).padStart(2, '0')}
                                </span>
                            </TabsPrimitive.Trigger>
                        ))}
                    </TabsPrimitive.List>
                    <span
                        aria-hidden
                        className="from-background pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l to-transparent lg:hidden"
                    />
                </div>
            </div>

            {/* Search results take the panel slot; the topic panels stay mounted (hidden) for crawlers */}
            {results && (
                <div className="flex min-w-0 flex-1 flex-col gap-6">
                    {results.length > 0 ? (
                        <Accordion type="multiple" defaultValue={results.map((r) => r.item.slug)}>
                            {results.map(({ item, category }) => (
                                <AccordionItem key={item.slug} value={item.slug} id={item.slug}>
                                    <AccordionTrigger>
                                        <span className="flex flex-col gap-1">
                                            <span className="text-muted-foreground text-xs font-medium">{category.title}</span>
                                            {item.question}
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <FaqAnswer text={item.answer} />
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <FaqCta title={t('faq.no_results')} button={t('faq.ask_us')} />
                    )}
                </div>
            )}

            {categories.map((category) => {
                const values = open[category.key] ?? [];
                const allOpen = values.length === category.items.length;
                return (
                    <TabsPrimitive.Content
                        key={category.key}
                        value={category.key}
                        forceMount
                        hidden={results !== null || active !== category.key}
                        className="focus-ring flex min-w-0 flex-1 flex-col gap-8 rounded-none"
                    >
                        {/* The topic anchor lives here (Radix owns the panel id, targeted by the tab's aria-controls) */}
                        <div id={category.slug} className="flex scroll-mt-24 items-baseline justify-between gap-4">
                            {/* Radix renders each question as an <h3>: the topic is the h2 that keeps h1 → h2 → h3 */}
                            <h2 className="text-2xl font-medium tracking-tight">{category.title}</h2>
                            <button
                                type="button"
                                onClick={() => setOpenFor(category, allOpen ? [] : category.items.map((i) => i.slug))}
                                className="focus-ring text-muted-foreground hover:text-foreground shrink-0 rounded-none text-xs"
                            >
                                {allOpen ? t('faq.collapse_all') : t('faq.expand_all')}
                            </button>
                        </div>
                        <Accordion type="multiple" value={values} onValueChange={(v) => setOpenFor(category, v)}>
                            {category.items.map((item: FaqItem) => (
                                <AccordionItem key={item.slug} value={item.slug} id={item.slug} className="scroll-mt-24">
                                    <AccordionTrigger>{item.question}</AccordionTrigger>
                                    <AccordionContent>
                                        <FaqAnswer text={item.answer} />
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                        <FaqCta title={t('faq.cta_title')} button={t('faq.cta_button')} />
                    </TabsPrimitive.Content>
                );
            })}
        </TabsPrimitive.Root>
    );
}
