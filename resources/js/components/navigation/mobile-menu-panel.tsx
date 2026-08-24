import LanguageLinks from '@/components/i18n/language-links';
import { type NavItem, useSecondaryNavItems } from '@/components/navigation/nav-items';
import NavLink from '@/components/navigation/nav-link';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type PointerEvent, type ReactNode, useEffect, useRef } from 'react';

type MobileMenuPanelProps = {
    id: string;
    open: boolean;
    compact: boolean;
    items: NavItem[];
    isActive: (href?: string) => boolean;
    cta: ReactNode;
    onClose: () => void;
};

/** Staggered entrance of the rows once the panel has dropped in (tailwindcss-animate: delay = animation-delay). */
const rowEnter = 'animate-in fade-in slide-in-from-top-2 fill-mode-both duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none';
const rowDelays = ['delay-200', 'delay-300', 'delay-500', 'delay-700', 'delay-1000'];

/**
 * Mobile menu (Figma 137-3968) opening *under* the header bar, which stays in place: the panel
 * slides down to the bottom of the viewport, rows stagger in, CTA and "EN | FR" are pinned at the bottom.
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
                'absolute inset-x-0 top-full overflow-hidden lg:hidden',
                open ? 'pointer-events-auto' : 'pointer-events-none',
                compact ? 'h-[calc(100dvh-3.5rem)]' : 'h-[calc(100dvh-4rem)]',
            )}
        >
            <div
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                className={cn(
                    'bg-card text-card-foreground flex h-full flex-col overflow-y-auto overscroll-contain p-4 transition-[transform,opacity,visibility] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                    open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-full opacity-0 duration-400',
                )}
            >
                <nav aria-label={t('nav.mobile')} className="pt-4">
                    <ul className="flex flex-col gap-1">
                        {open &&
                            items.map((item, i) => (
                                <li key={item.key} className={cn(rowEnter, rowDelays[i] ?? 'delay-1000')}>
                                    <NavLink
                                        ref={i === 0 ? firstLink : undefined}
                                        href={item.href}
                                        size="lg"
                                        active={isActive(item.href)}
                                        aria-current={isActive(item.href) ? 'page' : undefined}
                                        onClick={onClose}
                                    >
                                        {item.label}
                                    </NavLink>
                                </li>
                            ))}
                    </ul>
                    {open && secondary.length > 0 && (
                        <>
                            <span
                                aria-hidden
                                className={cn(
                                    'via-border my-3 block h-px w-full bg-gradient-to-r from-transparent to-transparent',
                                    rowEnter,
                                    'delay-500',
                                )}
                            />
                            <ul className="flex flex-col gap-1">
                                {secondary.map((item, i) => (
                                    <li key={item.key} className={cn(rowEnter, rowDelays[items.length + i] ?? 'delay-1000')}>
                                        <NavLink
                                            href={item.href}
                                            size="lg"
                                            active={isActive(item.href)}
                                            aria-current={isActive(item.href) ? 'page' : undefined}
                                            onClick={onClose}
                                        >
                                            {item.label}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </nav>

                {open && (
                    <div
                        className={cn(
                            'mt-auto flex flex-col items-center gap-5 pb-4 [&>*:first-child]:w-full [&>*:first-child>a]:w-full',
                            rowEnter,
                            'delay-700',
                        )}
                    >
                        <div>{cta}</div>
                        <LanguageLinks />
                    </div>
                )}
            </div>
        </div>
    );
}
