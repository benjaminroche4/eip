import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { ChevronDown, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type LegalTocProps = { headings: string[] };

/** Reading offset under the sticky header — matches the sections' `scroll-mt-24` (96px) plus a margin. */
const SPY_OFFSET = 120;

/**
 * Table of contents of a legal page, linking to `#legal-section-{index}` anchors. Same rows as the FAQ
 * topics column: sand rows with the number on the right, sticky on desktop. On mobile the bordered "contents"
 * button opens the site's bottom sheet (the filter bar's drawer) listing every section in compact rows: the
 * dropdown it replaced had no height limit and overflowed the screen with 12 sections (user decision 2026-10-11).
 * A scrollspy keeps the entry of the section being read on the sand surface (`aria-current`), so the reader
 * always sees where they are (user decision 2026-08-31).
 */
export default function LegalToc({ headings }: LegalTocProps) {
    const { t } = useTranslation();
    const [active, setActive] = useState(0);
    const [open, setOpen] = useState(false);

    // Scrollspy: the current section is the last one whose top passed the reading line. That line sits under the sticky
    // header at the top of the page and slides down to the bottom edge of the viewport as the page reaches its end, so
    // the short last sections (which never get under the header) still take their turn and the last one is active at
    // the very bottom (bug 2026-09-22: the highlight stopped on the 6th of 9 sections).
    useEffect(() => {
        let raf = 0;
        const spy = () => {
            raf = 0;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
            const line = SPY_OFFSET + (window.innerHeight - SPY_OFFSET) * progress;
            let current = 0;
            headings.forEach((_, index) => {
                const section = document.getElementById(`legal-section-${index}`);
                if (section && section.getBoundingClientRect().top <= line) current = index;
            });
            setActive(current);
        };
        const onScroll = () => {
            raf ||= window.requestAnimationFrame(spy);
        };
        spy();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            if (raf) window.cancelAnimationFrame(raf);
        };
    }, [headings]);

    const number = (index: number) => (
        <span aria-hidden className="text-muted-foreground text-xs tabular-nums">
            {String(index + 1).padStart(2, '0')}
        </span>
    );

    return (
        <nav aria-label={t('legal_pages.toc')} className="shrink-0 lg:sticky lg:top-24 lg:w-72 lg:self-start">
            {/* Mobile: bordered trigger showing the current section, then the bottom sheet with every section */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger className="group focus-ring border-border bg-card flex h-11 w-full items-center justify-between gap-3 rounded-none border px-4 text-sm lg:hidden">
                    <span>{t('legal_pages.toc')}</span>
                    <span className="text-muted-foreground flex min-w-0 items-center gap-2">
                        <span className="truncate">{headings[active]}</span>
                        <ChevronDown
                            aria-hidden
                            className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                        />
                    </span>
                </SheetTrigger>
                <SheetContent
                    side="bottom"
                    hideClose
                    className="bg-background-05 flex max-h-[85dvh] flex-col gap-4 overflow-y-auto p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:hidden"
                >
                    <div className="flex items-center justify-between gap-3">
                        <SheetTitle className="text-xl font-medium tracking-tight">{t('legal_pages.toc')}</SheetTitle>
                        <SheetClose className="focus-ring border-border bg-card text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-none border transition-colors duration-300">
                            <X aria-hidden className="size-4" />
                            <span className="sr-only">{t('a11y.close')}</span>
                        </SheetClose>
                    </div>
                    <SheetDescription className="sr-only">{headings[active]}</SheetDescription>
                    <ol role="list" className="flex flex-col gap-0.5">
                        {headings.map((heading, index) => (
                            <li key={heading}>
                                <SheetClose asChild>
                                    <a
                                        href={`#legal-section-${index}`}
                                        aria-current={index === active ? 'true' : undefined}
                                        className={cn(
                                            'focus-ring flex items-center gap-4 rounded-none px-4 py-2.5 text-sm',
                                            index === active
                                                ? 'bg-background-08 text-foreground'
                                                : 'bg-card text-muted-foreground hover:text-foreground',
                                        )}
                                    >
                                        <span className="min-w-0 flex-1">{heading}</span>
                                        {number(index)}
                                    </a>
                                </SheetClose>
                            </li>
                        ))}
                    </ol>
                </SheetContent>
            </Sheet>

            {/* Desktop: the sticky column of rows */}
            <ol role="list" className="flex flex-col gap-0.5 max-lg:hidden">
                {headings.map((heading, index) => (
                    <li key={heading}>
                        <a
                            href={`#legal-section-${index}`}
                            aria-current={index === active ? 'true' : undefined}
                            className={cn(
                                'focus-ring flex items-center gap-4 rounded-none px-4 py-3 text-sm',
                                index === active
                                    ? 'bg-background-08 text-foreground'
                                    : 'text-muted-foreground hover:bg-background-05 hover:text-foreground',
                            )}
                        >
                            <span className="min-w-0 flex-1">{heading}</span>
                            {/* Section number (decorative), like the FAQ question counters */}
                            {number(index)}
                        </a>
                    </li>
                ))}
            </ol>
        </nav>
    );
}
