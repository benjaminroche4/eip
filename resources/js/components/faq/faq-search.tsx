import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { Search } from 'lucide-react';
import { useEffect, useRef } from 'react';

type FaqSearchProps = {
    id: string;
    value: string;
    onChange: (value: string) => void;
    /** Result count while a search is active, null otherwise. */
    count: number | null;
};

/**
 * FAQ search field (ui.sh option « Avec raccourci », decision 2026-08-27): framed field on the card surface, search
 * icon on the left, a `/` key hint on the right — pressing `/` anywhere on the page (outside another field) focuses it.
 */
export default function FaqSearch({ id, value, onChange, count }: FaqSearchProps) {
    const { t, tc } = useTranslation();
    const input = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const typing = target?.closest('input, textarea, select, [contenteditable="true"]');
            if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                input.current?.focus();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={id} className="sr-only">
                {t('faq.search_label')}
            </Label>
            <div className="relative">
                <Search aria-hidden className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                    ref={input}
                    id={id}
                    name="q"
                    type="search"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={t('faq.search_placeholder')}
                    autoComplete="off"
                    className="bg-card focus-visible:border-foreground h-10 pr-12 pl-9 focus-visible:ring-0 [&::-webkit-search-cancel-button]:appearance-none"
                />
                <kbd
                    aria-hidden
                    className="border-border text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2 border px-1.5 py-0.5 font-sans text-[0.625rem] tabular-nums"
                >
                    /
                </kbd>
            </div>
            {count !== null && (
                <p role="status" className="text-muted-foreground text-xs">
                    {tc('faq.results', count)}
                </p>
            )}
        </div>
    );
}
