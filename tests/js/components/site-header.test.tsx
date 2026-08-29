import SiteHeader from '@/components/layout/site-header';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

describe('SiteHeader', () => {
    it('renders the brand link, the main navigation and the CTA', () => {
        renderPage(<SiteHeader />);

        expect(screen.getByRole('link', { name: 'Homepage' })).toHaveAttribute('href', '/');
        const nav = screen.getByRole('navigation', { name: 'Navigation principale' });
        expect(within(nav).getAllByRole('link').length).toBeGreaterThanOrEqual(3);
        expect(screen.getByRole('link', { name: 'Nous contacter' })).toHaveAttribute('href', '/contact');
    });

    it('marks the current page with aria-current', () => {
        renderPage(<SiteHeader />, { url: '/acheter-immobilier-paris' });

        const nav = screen.getByRole('navigation', { name: 'Navigation principale' });
        const current = within(nav)
            .getAllByRole('link')
            .find((l) => l.getAttribute('aria-current') === 'page');
        expect(current).toHaveAttribute('href', '/acheter-immobilier-paris');
    });

    it('is fully keyboard operable: Tab reaches every control in order', async () => {
        const user = userEvent.setup();
        renderPage(<SiteHeader />);

        await user.tab();
        expect(screen.getByRole('link', { name: 'Homepage' })).toHaveFocus();
        await user.tab();
        const nav = screen.getByRole('navigation', { name: 'Navigation principale' });
        expect(within(nav).getAllByRole('link')[0]).toHaveFocus();
    });

    it('opens and closes the mobile menu with the keyboard, restoring focus to the toggle', async () => {
        const user = userEvent.setup();
        renderPage(<SiteHeader />);

        const toggle = screen.getByRole('button', { name: 'Ouvrir le menu' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');

        toggle.focus();
        await user.keyboard('{Enter}');
        expect(screen.getByRole('button', { name: 'Fermer le menu' })).toHaveAttribute('aria-expanded', 'true');
        const mobileNav = screen.getByRole('navigation', { name: 'Navigation mobile' });
        expect(within(mobileNav).getAllByRole('link')[0]).toHaveFocus();

        await user.keyboard('{Escape}');
        expect(screen.getByRole('button', { name: 'Ouvrir le menu' })).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByRole('button', { name: 'Ouvrir le menu' })).toHaveFocus();
    });

    it('has no axe violations (closed and open)', async () => {
        const user = userEvent.setup();
        const { container } = renderPage(<SiteHeader />);
        expect(await axe(container)).toHaveNoViolations();

        await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
        expect(await axe(container)).toHaveNoViolations();
    });
});
