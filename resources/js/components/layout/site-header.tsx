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
export default function SiteHeader() {
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
        toggleRef.current?.focus({ preventScroll: true });
    }, []);
    // Mobile: slide the bar away while scrolling down, bring it back on the first upward scroll (never while the menu is open).
    const hidden = scrolled && direction === 'down' && !menuOpen;

    const cta = (
        <Button asChild size="lg">
            <Link href={contactHref} prefetch>
                {t('nav.contact')}
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
                scrolled ? 'lg:px-0 lg:pt-0' : 'lg:px-5 lg:pt-3',
                hidden && '-translate-y-full lg:translate-y-0',
            )}
        >
            {/* Floating card that morphs into an edge-to-edge translucent bar once scrolled */}
            <div
                className={cn(
                    'text-card-foreground relative mx-auto transition-[max-width,border-radius,background-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                    'after:via-border after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:to-transparent after:transition-opacity after:duration-500',
                    scrolled
                        ? 'bg-card/80 supports-[backdrop-filter]:bg-card/70 max-w-full rounded-none backdrop-blur-md after:opacity-100'
                        : 'bg-card max-w-7xl after:opacity-0',
                    menuOpen && 'bg-card after:opacity-100',
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
