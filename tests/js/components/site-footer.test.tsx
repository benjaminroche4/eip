import SiteFooter from '@/components/layout/site-footer';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

describe('SiteFooter', () => {
    it('renders navigation, contact, social links and the legal bar', () => {
        renderPage(<SiteFooter year={2026} />);

        expect(screen.getByRole('navigation', { name: 'Navigation' })).toBeInTheDocument();
        const card = screen.getByRole('link', { name: /Nos conseillers sont à votre écoute/ });
        expect(card).toHaveTextContent('+33 6 00 00 00 00');
        expect(screen.getByRole('list', { name: 'Nos conseillers' }).children).toHaveLength(3);
        expect(screen.getByText('© 2026 Estate in Paris')).toBeInTheDocument();

        const legal = screen.getByRole('navigation', { name: /légaux|legal/i });
        expect(within(legal).getByRole('link', { name: 'Mentions légales' })).toHaveAttribute('href', '/fr/mentions-legales');
        expect(within(legal).getByRole('link', { name: 'Politique de confidentialité' })).toHaveAttribute('href', '/fr/politique-de-confidentialite');
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

        const focusables = Array.from(container.querySelectorAll<HTMLElement>('a[href], button'));
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
