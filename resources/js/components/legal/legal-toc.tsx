import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

type LegalTocProps = { headings: string[] };

/** Reading offset under the sticky header — matches the sections' `scroll-mt-24` (96px) plus a margin. */
const SPY_OFFSET = 120;

/**
 * Table of contents of a legal page, linking to `#legal-section-{index}` anchors. Same menu as the FAQ
 * topics column: sand rows with the number on the right, sticky on desktop, a bordered "contents" dropdown
 * on mobile. A scrollspy keeps the entry of the section being read on the sand surface (`aria-current`),
 * so the reader always sees where they are (user decision 2026-08-31).
 */
export default function LegalToc({ headings }: LegalTocProps) {
    const { t } = useTranslation();
    const [active, setActive] = useState(0);

    // Scrollspy: the current section is the last one whose top passed under the sticky header.
    useEffect(() => {
        let raf = 0;
        const spy = () => {
            raf = 0;
            let current = 0;
            headings.forEach((_, index) => {
                const section = document.getElementById(`legal-section-${index}`);
                if (section && section.getBoundingClientRect().top <= SPY_OFFSET) current = index;
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
            {/* Mobile: the same bordered "contents" dropdown as the FAQ */}
            <DropdownMenu>
                <DropdownMenuTrigger className="group focus-ring border-border bg-card flex h-11 w-full items-center justify-between gap-3 rounded-none border px-4 text-sm lg:hidden">
                    <span>{t('legal_pages.toc')}</span>
                    <span className="text-muted-foreground flex min-w-0 items-center gap-2">
                        <span className="truncate">{headings[active]}</span>
                        <ChevronDown
                            aria-hidden
                            className="size-4 shrink-0 transition-transform group-data-open:rotate-180 motion-reduce:transition-none"
                        />
                    </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
                    {headings.map((heading, index) => (
                        <DropdownMenuItem key={heading} asChild>
                            <a
                                href={`#legal-section-${index}`}
                                className={cn(
                                    'focus:bg-background-05 justify-between rounded-none py-2.5',
                                    index === active && 'bg-background-08 focus:bg-background-08 text-foreground',
                                )}
                            >
                                {heading}
                                {number(index)}
                            </a>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

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
