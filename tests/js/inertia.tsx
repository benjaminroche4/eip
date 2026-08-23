import { type SharedData } from '@/types';
import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement } from 'react';
import { vi } from 'vitest';
import translations from './fixtures/translations.json';

/** Minimal Ziggy-like route(): named routes of the localized public site (FR). */
const ROUTES: Record<string, string> = {
    home: '/fr',
    search: '/fr/recherche',
    privacy: '/fr/politique-de-confidentialite',
    legal: '/fr/mentions-legales',
    terms: '/fr/conditions-generales',
};
export function routeStub(name?: string): string & { has: (n: string) => boolean } {
    if (name === undefined) return { has: (n: string) => n in ROUTES } as never;
    return ROUTES[name] ?? `/fr/${name}`;
}

export function sharedProps(overrides: Partial<SharedData> = {}): SharedData {
    return {
        name: 'Estate in Paris',
        quote: { message: '', author: '' },
        auth: { user: null as never },
        locale: 'fr',
        year: 2026,
        localization: {
            current: 'fr',
            default: 'fr',
            regional: 'fr_FR',
            locales: [
                { code: 'fr', native: 'Français', regional: 'fr_FR', url: 'http://localhost/fr', current: true },
                { code: 'en', native: 'English', regional: 'en_GB', url: 'http://localhost/en', current: false },
            ],
            alternates: { fr: 'http://localhost/fr', en: 'http://localhost/en' },
        },
        translations: translations.fr,
        seo: {
            siteName: 'Estate in Paris',
            separator: ' · ',
            description: '',
            image: '/og-default.png',
            locale: 'fr_FR',
            twitter: null,
            organization: {
                name: 'Estate in Paris',
                logo: '/brand/logo_dark_desktop.svg',
                sameAs: [],
                email: 'contact@example.com',
                phone: '+33 6 00 00 00 00',
                address: { street: '22 Rue Notre Dame de Nazareth', city: 'Paris', postal_code: '75003', country: 'FR' },
            },
            social: { linkedin: 'https://www.linkedin.com/company/x', facebook: 'https://www.facebook.com/x' },
            hours: { spec: 'Mo-Sa 09:00-19:00', label: 'Lun – Sam, 9h – 19h' },
            reviews: { rating: 4.9, count: 400, url: 'https://www.google.com/maps' },
        },
        ziggy: { location: 'http://localhost/fr', url: 'http://localhost' },
        ...overrides,
    } as SharedData;
}

/** Current Inertia page used by the mocked usePage(); change `url` per test to assert active states. */
export const page = { url: '/fr', props: sharedProps() };

vi.mock('@inertiajs/react', async () => {
    const React = await import('react');
    const Link = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean | string }>(function Link(
        { prefetch, children, ...props },
        ref,
    ) {
        void prefetch; // Inertia-only prop, must not reach the DOM
        return React.createElement('a', { ref, ...props }, children);
    });
    return {
        Link,
        usePage: () => page,
        Head: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
        router: { get: vi.fn(), visit: vi.fn() },
    };
});

export function renderPage(ui: ReactElement, options?: RenderOptions & { url?: string }) {
    page.url = options?.url ?? '/fr';
    return render(ui, options);
}
