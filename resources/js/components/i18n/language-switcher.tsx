import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';

type LanguageSwitcherProps = { className?: string; /** Header is scrolled/compact: panel matches the translucent bar. */ compact?: boolean };

/**
 * Current locale code opening (click / keyboard — never on hover) an editorial list of
 * <a hreflang> links to the same page in each locale: Montserrat rows separated by hairlines,
 * locale code in spaced capitals. Hover on the trigger only animates the underline.
 */
export default function LanguageSwitcher({ className, compact = false }: LanguageSwitcherProps) {
    const { localization } = usePage<SharedData>().props;
    const { t } = useTranslation();

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger
                aria-label={t('nav.language')}
                className={cn(
                    'group text-foreground focus-ring relative flex h-9 items-center gap-1.5 rounded-sm px-1 text-xs font-medium tracking-wide uppercase',
                    'after:bg-foreground after:absolute after:inset-x-1 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 data-[state=open]:after:scale-x-100 motion-reduce:after:transition-none',
                    className,
                )}
            >
                {localization.current}
                <ChevronDown
                    aria-hidden
                    className="text-muted-foreground size-3.5 transition-transform duration-300 group-data-[state=open]:rotate-180"
                />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={compact ? 14 : 8}
                collisionPadding={16}
                className={cn(
                    'border-border text-card-foreground divide-border min-w-48 divide-y rounded-md border p-0 shadow-none',
                    // open with a soft drop, no zoom
                    'data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 data-[side=bottom]:slide-in-from-top-3 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none',
                    compact ? 'bg-card/80 supports-[backdrop-filter]:bg-card/70 backdrop-blur-md' : 'bg-card',
                )}
            >
                {localization.locales.map((l) => (
                    <DropdownMenuItem key={l.code} asChild className="focus:bg-background-05 cursor-pointer rounded-none p-0">
                        <a
                            href={l.url}
                            hrefLang={l.code}
                            lang={l.code}
                            aria-current={l.current ? 'page' : undefined}
                            className={cn(
                                'font-heading hover:bg-background-05 flex h-12 w-full items-center gap-3 px-4 text-sm transition-colors',
                                l.current ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <span className="flex-1">{l.native}</span>
                            <span className="font-sans text-xs tracking-widest uppercase">{l.code}</span>
                        </a>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
