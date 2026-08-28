import { useTranslation } from '@/hooks/use-translation';
import { usePage } from '@inertiajs/react';

export type NavItem = { key: string; label: string; href: string; badge?: string };

/** Primary navigation entries (labels from lang/ui.php). */
export function useNavItems(): NavItem[] {
    const { t } = useTranslation();
    return [
        { key: 'buy', label: t('nav.buy'), href: route('buy') },
        { key: 'sell', label: t('nav.sell'), href: route('sell') },
        { key: 'estimate', label: t('nav.estimate'), href: route('estimate') },
    ];
}

/** Contact page URL. */
export function useContactHref(): string {
    return route('contact');
}

/** Footer navigation: main entries, then contact, newsletter and blog. */
export function useFooterNavItems(): NavItem[] {
    const { t } = useTranslation();
    return [
        { key: 'buy', label: t('nav.buy'), href: route('buy') },
        { key: 'sell', label: t('nav.sell'), href: route('sell') },
        { key: 'estimate', label: t('nav.estimate'), href: route('estimate') },
        { key: 'contact', label: t('nav.contact_page'), href: route('contact') },
        { key: 'newsletter', label: t('nav.newsletter'), href: route('newsletter') },
        { key: 'faq', label: t('nav.faq'), href: route('faq') },
        { key: 'blog', label: t('nav.blog'), href: route('blog.index') },
    ];
}

/** Secondary entries shown under a divider in the mobile menu (blog, later: about…). */
export function useSecondaryNavItems(): NavItem[] {
    const { t } = useTranslation();
    return [{ key: 'blog', label: t('nav.blog'), href: route('blog.index') }];
}

/** Matches an href against the current Inertia URL (ignores query/hash, never matches "#"). */
export function useIsActive() {
    const { url } = usePage();
    const currentPath = url.split(/[?#]/)[0];
    return (href?: string) => !!href && href !== '#' && new URL(href, 'http://x').pathname === currentPath;
}
