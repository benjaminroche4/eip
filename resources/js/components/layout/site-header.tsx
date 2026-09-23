import LanguageSwitcher from '@/components/i18n/language-switcher';
import BrandLogo from '@/components/layout/brand-logo';
import MobileMenuPanel from '@/components/navigation/mobile-menu-panel';
import MobileMenuToggle from '@/components/navigation/mobile-menu-toggle';
import NavDivider from '@/components/navigation/nav-divider';
import { useContactHref, useIsActive, useNavItems } from '@/components/navigation/nav-items';
import NavLink from '@/components/navigation/nav-link';
import { Button } from '@/components/ui/button';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { useScrolled } from '@/hooks/use-scrolled';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { useCallback, useId, useRef, useState } from 'react';

/** Site header (Figma 137-2085 desktop, 125-361 mobile). */
/** `overlay`: the header floats over a full-bleed hero (home) — the desktop gap above the card stays transparent until scrolled. */
export default function SiteHeader({ overlay = false }: { overlay?: boolean }) {
    const { t } = useTranslation();
    const navItems = useNavItems();
    const contactHref = useContactHref();
    const isActive = useIsActive();
    const scrolled = useScrolled();
    const direction = useScrollDirection();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuId = useId();
    const toggleRef = useRef<HTMLButtonElement>(null);
    const closeMenu = useCallback(() => {
        setMenuOpen(false);
        // Focus back on the toggle only while it is displayed (`lg:hidden` applies once the menu closes on a resize to desktop;
        // computed `display`, not `offsetParent`, which jsdom never sets)
        const toggle = toggleRef.current;
        if (toggle && getComputedStyle(toggle).display !== 'none') toggle.focus({ preventScroll: true });
    }, []);
    // Mobile: slide the bar away while scrolling down, bring it back on the first upward scroll (never while the menu is open).
    const hidden = scrolled && direction === 'down' && !menuOpen;

    // Discreet light sweep on the CTA so it stands out (user decision 2026-09-22): a narrow, slanted, soft white band crosses the button every 8 s.
    const cta = (
        <Button asChild size="lg" className="relative overflow-hidden">
            <Link href={contactHref} prefetch>
                <span
                    aria-hidden
                    className="animate-sweep-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-linear-to-r from-transparent via-white/30 to-transparent blur-[2px] motion-reduce:hidden"
                />
                <span className="relative">{t('nav.contact')}</span>
            </Link>
        </Button>
    );

    return (
        <header
            data-scrolled={scrolled}
            data-hidden={hidden}
            className={cn(
                // Fixed in-flow height (bar + desktop top gap): compacting happens inside, so the document never
                // reflows above the viewport — otherwise Chrome's scroll anchoring shifts scrollY and the header flickers.
                'sticky top-0 z-40 h-16 w-full transition-[padding,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] [overflow-anchor:none] motion-reduce:transition-none lg:h-19',
                // Desktop: the 12px gap above the floating card is painted with the page background (behind the card, above the
                // content) and shrinks with the padding, so nothing ever shows through while the card settles at the top.
                'lg:before:absolute lg:before:inset-x-0 lg:before:top-0 lg:before:-z-10 lg:before:transition-[height] lg:before:duration-500 lg:before:ease-[cubic-bezier(0.16,1,0.3,1)] lg:before:motion-reduce:transition-none',
                !overlay && 'lg:before:bg-background',
                scrolled ? 'lg:px-0 lg:pt-0 lg:before:h-0' : 'lg:px-5 lg:pt-3 lg:before:h-3',
                hidden && '-translate-y-full lg:translate-y-0',
            )}
        >
            {/* Floating card that morphs into an edge-to-edge solid white bar once scrolled */}
            <div
                className={cn(
                    'text-card-foreground relative mx-auto transition-[max-width,border-radius,background-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                    'after:via-border after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:to-transparent after:transition-opacity after:duration-500',
                    // Hairline under the bar: desktop only, once scrolled (never on mobile, menu open or closed — user decision 2026-09-16).
                    // Scrolled: solid white edge-to-edge bar, no blur (user decision 2026-09-16).
                    scrolled
                        ? 'bg-card supports-[backdrop-filter]:bg-card max-w-full rounded-none backdrop-blur-none after:opacity-0 lg:after:opacity-100'
                        : // Solid white card at every width, no blur (user decision 2026-09-16).
                          'bg-card supports-[backdrop-filter]:bg-card max-w-7xl backdrop-blur-none after:opacity-0',
                    // Menu open: solid white, whatever the scroll state.
                    // Switched fast so the bar and the panel turn white together.
                    menuOpen && 'bg-card supports-[backdrop-filter]:bg-card backdrop-blur-none duration-0',
                )}
            >
                <div
                    className={cn(
                        'mx-auto flex max-w-7xl items-center justify-between px-4 transition-[height,padding] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none lg:justify-start lg:gap-5 lg:px-5',
                        scrolled ? 'h-14' : 'h-16',
                    )}
                >
                    <Link
                        href={route('home')}
                        aria-label="Homepage"
                        className={cn(
                            'focus-ring flex shrink-0 origin-left items-center rounded-none transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                            scrolled && 'scale-90',
                        )}
                    >
                        <BrandLogo priority />
                    </Link>

                    <NavDivider />

                    <nav className="hidden flex-1 items-center gap-5 lg:flex" aria-label={t('nav.main')}>
                        {navItems.map((item) => (
                            <NavLink key={item.key} href={item.href} active={isActive(item.href)}>
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="ml-auto hidden items-center gap-6 lg:flex">
                        <LanguageSwitcher compact={scrolled} />
                        <NavDivider />
                        {cta}
                    </div>

                    <MobileMenuToggle ref={toggleRef} open={menuOpen} controls={menuId} onToggle={() => setMenuOpen((o) => !o)} />
                </div>

                <MobileMenuPanel id={menuId} open={menuOpen} compact={scrolled} items={navItems} isActive={isActive} cta={cta} onClose={closeMenu} />
            </div>
        </header>
    );
}
