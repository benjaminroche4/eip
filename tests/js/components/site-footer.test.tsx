import SiteFooter from '@/components/layout/site-footer';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage, sharedProps } from '../inertia';

describe('SiteFooter', () => {
    it('renders navigation, contact, social links and the legal bar', () => {
        renderPage(<SiteFooter year={2026} />);

        const nav = screen.getByRole('navigation', { name: 'Nos services' });
        expect(
            within(nav)
                .getAllByRole('link')
                .map((l) => l.textContent),
        ).toEqual(['Acheter', 'Vendre', 'Estimation', 'Relocation(nouvel onglet)']);
        const relocation = within(nav).getByRole('link', { name: /Relocation/ }); // sister agency: external, new tab
        expect(relocation).toHaveAttribute('href', 'https://relocation-in-paris.fr/');
        expect(relocation).toHaveAttribute('target', '_blank');
        expect(relocation).toHaveAttribute('rel', 'noopener noreferrer');
        const about = screen.getByRole('navigation', { name: 'À propos' });
        expect(
            within(about)
                .getAllByRole('link')
                .map((l) => l.textContent),
        ).toEqual(['Contactez-nous', 'Newsletter', 'FAQ', 'Blog', 'À propos']);
        expect(within(about).getByRole('link', { name: 'Newsletter' })).toHaveAttribute('href', '/newsletter');
        expect(within(about).getByRole('link', { name: 'À propos' })).toHaveAttribute('href', '/a-propos');
        const card = screen.getByRole('link', { name: /Nos conseillers sont à votre écoute/ });
        expect(card).toHaveTextContent('+33 6 00 00 00 00');
        expect(screen.getByRole('list', { name: 'Nos conseillers' }).children).toHaveLength(3);
        expect(screen.getByText('Ouvert')).toBeInTheDocument();
        expect(screen.getByText('© 2026 Estate in Paris')).toBeInTheDocument();

        const contactButtons = screen.getAllByRole('link', { name: 'Contactez-nous' }).filter((a) => /\bbg-card\b/.test(a.className));
        expect(contactButtons).toHaveLength(1); // the outline button, white on the sand footer
        expect(screen.getByText(sharedProps().seo.organization.phone!).className).toMatch(/whitespace-nowrap/); // phone on one line
        const languages = screen.getByRole('navigation', { name: 'Langue' }); // inline EN | FR: real links in the HTML, not a menu
        expect(within(languages).getByRole('link', { name: 'en' })).toHaveAttribute('hreflang', 'en');
        expect(within(languages).getByRole('link', { name: 'fr' })).toHaveAttribute('aria-current', 'page');
        const legal = screen.getByRole('navigation', { name: /légaux|legal/i });
        expect(legal.parentElement!.className).toMatch(/\bitems-center\b.*\btext-center\b|\btext-center\b.*\bitems-center\b/); // centred on mobile
        expect(legal.querySelector('ul')!.className).toMatch(/justify-center/);
        expect(within(legal).getByRole('link', { name: 'Mentions légales' })).toHaveAttribute('href', '/mentions-legales');
        expect(within(legal).getByRole('link', { name: 'Politique de confidentialité' })).toHaveAttribute('href', '/politique-de-confidentialite');
    });

    it('only renders configured social networks, as safe external links', () => {
        renderPage(<SiteFooter year={2026} />);

        const social = screen.getByRole('list', { name: 'Nous suivre' });
        const links = within(social).getAllByRole('link');
        expect(links).toHaveLength(2);
        for (const link of links) {
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
            expect(link).toHaveAccessibleName();
        }
    });

    it('every link is reachable with Tab and none is an empty anchor', async () => {
        const user = userEvent.setup();
        const { container } = renderPage(<SiteFooter year={2026} />);

        const focusables = Array.from(container.querySelectorAll<HTMLElement>('a[href], button, input:not([tabindex="-1"])'));
        for (const el of focusables) {
            await user.tab();
            expect(el).toHaveFocus();
        }
    });

    it('has no axe violations', async () => {
        const { container } = renderPage(<SiteFooter year={2026} />);
        expect(await axe(container)).toHaveNoViolations();
    });
});
