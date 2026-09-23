import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export type NavItem = {
    key: string;
    label: string;
    href: string;
    badge?: string;
    /** Action-oriented label for the mobile menu (« Estimer mon bien »). */
    mobileLabel?: string;
    /** Another site (opens in a new tab, plain <a>, no prefetch). */
    external?: boolean;
};

/** Primary navigation entries (labels from lang/ui.php). */
export function useNavItems(): NavItem[] {
    const { t } = useTranslation();
    return [
        { key: 'buy', label: t('nav.buy'), href: route('buy') },
        { key: 'sell', label: t('nav.sell'), href: route('sell') },
        { key: 'estimate', label: t('nav.estimate'), href: route('estimate'), mobileLabel: t('nav.estimate_mobile') },
    ];
}

/** Contact page URL. */
export function useContactHref(): string {
    return route('contact');
}

/** Footer « Nos services » column: the three service pages, then the sister agency Relocation in Paris (external, user decision 2026-09-22). */
export function useFooterNavItems(): NavItem[] {
    const { t } = useTranslation();
    const { seo } = usePage<SharedData>().props;
    return [
        { key: 'buy', label: t('nav.buy'), href: route('buy') },
        { key: 'sell', label: t('nav.sell'), href: route('sell') },
        { key: 'estimate', label: t('nav.estimate'), href: route('estimate') },
        ...(seo.relocationUrl ? [{ key: 'relocation', label: t('nav.relocation'), href: seo.relocationUrl, external: true }] : []),
    ];
}

/** Footer « À propos » column: contact, newsletter, FAQ, blog and the about page (user decision 2026-09-16). */
export function useFooterAboutItems(): NavItem[] {
    const { t } = useTranslation();
    return [
        { key: 'contact', label: t('nav.contact_page'), href: route('contact') },
        { key: 'newsletter', label: t('nav.newsletter'), href: route('newsletter') },
        { key: 'faq', label: t('nav.faq'), href: route('faq') },
        { key: 'blog', label: t('nav.blog'), href: route('blog.index') },
        { key: 'about', label: t('nav.about'), href: route('about') },
        { key: 'districts', label: t('nav.districts'), href: route('districts') },
    ];
}

/** Secondary entries shown under a divider in the mobile menu: blog, FAQ, about (user decision 2026-09-16). */
export function useSecondaryNavItems(): NavItem[] {
    const { t } = useTranslation();
    return [
        { key: 'blog', label: t('nav.blog'), href: route('blog.index') },
        { key: 'faq', label: t('nav.faq'), href: route('faq') },
        { key: 'about', label: t('nav.about'), href: route('about') },
    ];
}

/** Matches an href against the current Inertia URL (ignores query/hash, never matches "#"). */
export function useIsActive() {
    const { url } = usePage();
    const currentPath = url.split(/[?#]/)[0];
    return (href?: string) => !!href && href !== '#' && new URL(href, 'http://x').pathname === currentPath;
}
