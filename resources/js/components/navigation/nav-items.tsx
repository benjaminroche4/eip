import { useTranslation } from '@/hooks/use-translation';
import { usePage } from '@inertiajs/react';

export type NavItem = { key: string; label: string; href: string };

/** Primary navigation entries (labels from lang/ui.php). "#" = page not built yet. */
export function useNavItems(): NavItem[] {
    const { t } = useTranslation();
    return [
        { key: 'buy', label: t('nav.buy'), href: route('search') },
        { key: 'sell', label: t('nav.sell'), href: '#' },
        { key: 'estimate', label: t('nav.estimate'), href: '#' },
    ];
}

/** Contact page URL — "#" until the route exists (see routes/web.php). */
export function useContactHref(): string {
    return route().has('contact') ? route('contact') : '#';
}

/** Matches an href against the current Inertia URL (ignores query/hash, never matches "#"). */
export function useIsActive() {
    const { url } = usePage();
    const currentPath = url.split(/[?#]/)[0];
    return (href?: string) => !!href && href !== '#' && new URL(href, 'http://x').pathname === currentPath;
}
