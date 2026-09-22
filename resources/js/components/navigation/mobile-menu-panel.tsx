import LanguageLinks from '@/components/i18n/language-links';
import { type NavItem, useSecondaryNavItems } from '@/components/navigation/nav-items';
import NavLink from '@/components/navigation/nav-link';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { House, KeyRound, Tag } from 'lucide-react';
import { type CSSProperties, type PointerEvent, type ReactNode, useEffect, useRef } from 'react';

/** Icons of the first-level entries (buy / sell / estimate). */
const ICONS = { buy: KeyRound, sell: Tag, estimate: House } as const;

type MobileMenuPanelProps = {
    id: string;
    open: boolean;
    compact: boolean;
    items: NavItem[];
    isActive: (href?: string) => boolean;
    cta: ReactNode;
    onClose: () => void;
};

/**
 * Mobile menu (Figma 137-3968) opening *under* the header bar, which stays in place: the panel
 * only takes the height of its content (white) over a blurred veil of the page; a tap on the veil, Escape, swipe-up or
 * resize to desktop closes it (150 ms fade out).
 * On opening, every row unfolds into place like a stack (rise + fade, 35 ms apart, expo-out:
 * `animate-menu-in` + `--stagger`, the tolerated dynamic style — user decision 2026-09-16). Links have no drawn underline (plain sand hover),
 * then the secondary links (blog, FAQ, about) in a sand gradient well, and the CTA + "EN | FR" right after — user decisions 2026-09-16.
 * Locks body scroll, closes on Escape / swipe-up / resize to desktop, moves focus to the first link.
 */
export default function MobileMenuPanel({ id, open, compact, items, isActive, cta, onClose }: MobileMenuPanelProps) {
    const { t } = useTranslation();
    const secondary = useSecondaryNavItems();
    const firstLink = useRef<HTMLAnchorElement>(null);
    const swipeStart = useRef<number | null>(null);

    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = 'hidden';
        firstLink.current?.focus({ preventScroll: true });

        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        const query = window.matchMedia('(min-width: 64rem)');
        const onResize = (e: MediaQueryListEvent | MediaQueryList) => e.matches && onClose();
        onResize(query);
        document.addEventListener('keydown', onKey);
        query.addEventListener('change', onResize);
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKey);
            query.removeEventListener('change', onResize);
        };
    }, [open, onClose]);

    // Rows are rendered only while open (so closing is instantaneous) and remount on every opening (key = openings count)
    // so the unfold replays.
    const wasOpen = useRef(false);
    const openings = useRef(0);
    if (open && !wasOpen.current) openings.current++;
    wasOpen.current = open;

    const secondaryProps = (item: NavItem) => ({ ...unfold(), active: isActive(item.href), onClose });

    // Stagger: rows animate in order (links, separator, secondary links, CTA block).
    let row = 0;
    const unfold = (className?: string): { className: string; style: CSSProperties } => ({
        className: cn(open && 'animate-menu-in [animation-delay:var(--stagger)] motion-reduce:animate-none', className),
        style: { '--stagger': `${row++ * 35}ms` } as CSSProperties,
    });

    const onPointerDown = (e: PointerEvent) => {
        swipeStart.current = e.pointerType === 'touch' ? e.clientY : null;
    };
    const onPointerUp = (e: PointerEvent) => {
        if (swipeStart.current !== null && swipeStart.current - e.clientY > 60) onClose();
        swipeStart.current = null;
    };

    return (
        <div
            id={id}
            aria-hidden={!open}
            className={cn(
                // Veil below the bar: blurred page behind the white panel; a tap on it closes the menu.
                // The blur itself is never transitioned (browsers rasterise it late, which reads as a two-step appearance): it shows
                // at once with the white panel and the bar. Only the tint layer below fades, lightly (user decision 2026-09-16).
                'absolute inset-x-0 top-full overflow-hidden backdrop-blur-md lg:hidden',
                open ? 'pointer-events-auto visible' : 'pointer-events-none invisible',
                compact ? 'h-[calc(100dvh-3.5rem)]' : 'h-[calc(100dvh-4rem)]',
            )}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {/* Tint of the veil, faded separately from the (static) blur. */}
            <span
                aria-hidden
                className={cn(
                    'bg-background/40 supports-[backdrop-filter]:bg-background/30 pointer-events-none absolute inset-0',
                    // Fades in only; closing is instantaneous for everything (veil, tint, panel, rows) — no cascade on the way out.
                    open ? 'opacity-100 transition-opacity duration-200 motion-reduce:transition-none' : 'opacity-0',
                )}
            />
            {/* The panel only takes the height of its content (white); the rest of the screen shows the blurred page. */}
            <div
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                className="bg-card text-card-foreground relative flex max-h-full flex-col overflow-y-auto overscroll-contain p-4"
            >
                {/* No divider under the bar and a tighter stack (user decision 2026-09-22: the top hairline tried the same day is gone) */}
                <nav key={openings.current} aria-label={t('nav.mobile')} className="flex flex-col gap-3">
                    <ul className="flex flex-col gap-1">
                        {open &&
                            items.map((item, i) => (
                                <li key={item.key} {...unfold()}>
                                    <NavLink
                                        ref={i === 0 ? firstLink : undefined}
                                        href={item.href}
                                        size="lg"
                                        plain
                                        active={isActive(item.href)}
                                        aria-current={isActive(item.href) ? 'page' : undefined}
                                        onClick={onClose}
                                        className="font-medium"
                                    >
                                        <MenuIcon itemKey={item.key} />
                                        {item.mobileLabel ?? item.label}
                                        {item.key === 'estimate' && <EstimateBadge label={t('nav.estimate_badge')} />}
                                    </NavLink>
                                </li>
                            ))}
                    </ul>
                    {open && secondary.length > 0 && (
                        /* Blog / FAQ / about in a sand gradient well (ui.sh variant « Dégradé sable », user decision 2026-09-16). */
                        <ul {...unfold('from-background-08 mt-2 flex flex-col gap-1 bg-linear-to-b to-transparent p-2')}>
                            {secondary.map((item) => (
                                <SecondaryItem key={item.key} item={item} {...secondaryProps(item)} />
                            ))}
                        </ul>
                    )}
                </nav>

                {open && (
                    <div key={`cta-${openings.current}`} className="contents">
                        <>
                            <div {...unfold('mt-3 flex flex-col items-center gap-3 pb-1 [&>*:first-child]:w-full [&>*:first-child>a]:w-full')}>
                                <div>{cta}</div>
                                <LanguageLinks />
                            </div>
                        </>
                    </div>
                )}
            </div>
        </div>
    );
}

/** Icon of a first-level entry (user decision 2026-09-16, ui.sh variant « Hairline verticale »): thin grey icon, then a short vertical hairline before the label. */
function MenuIcon({ itemKey }: { itemKey: string }) {
    const Icon = ICONS[itemKey as keyof typeof ICONS];
    if (!Icon) return null;
    return (
        <span className="flex shrink-0 items-center gap-3">
            <Icon aria-hidden className="text-muted-foreground size-4" strokeWidth={1.5} />
            <span aria-hidden className="bg-border h-5 w-px" />
        </span>
    );
}

/** Nudge badge on the valuation entry (user decision 2026-09-16, ui.sh variant « Carré sable »): square sand pill, white once the link is hovered / focused / current. */
function EstimateBadge({ label }: { label: string }) {
    return (
        <Badge
            variant="outline"
            className="bg-background-08 text-foreground group-hover:bg-card group-focus-visible:bg-card group-aria-[current=page]:bg-card ml-auto rounded-none border-0 px-2 py-0.5 text-[0.6875rem] font-medium"
        >
            {label}
        </Badge>
    );
}

/** One secondary link row (blog / FAQ / about) in the sand well: white hover / current state, with its unfold stagger. */
function SecondaryItem({
    item,
    active,
    onClose,
    className,
    style,
}: {
    item: NavItem;
    active: boolean;
    onClose: () => void;
    className: string;
    style: CSSProperties;
}) {
    return (
        <li className={className} style={style}>
            <NavLink
                href={item.href}
                size="lg"
                plain
                active={active}
                aria-current={active ? 'page' : undefined}
                onClick={onClose}
                // White hover / focus / current state on the sand well (user decision 2026-09-16), the first level keeps its sand hover.
                className="hover:bg-card focus-visible:bg-card aria-[current=page]:bg-card"
            >
                {item.label}
            </NavLink>
        </li>
    );
}
