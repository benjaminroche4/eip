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

describe('SiteHeader mobile menu layout', () => {
    it('lists the secondary links (blog, FAQ, about) with plain sand hover, then the CTA and the language links under a divider', async () => {
        const user = userEvent.setup();
        renderPage(<SiteHeader />);
        await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));

        const mobileNav = screen.getByRole('navigation', { name: 'Navigation mobile' });
        const links = within(mobileNav).getAllByRole('link');
        expect(links.slice(-3).map((l) => l.textContent)).toEqual(['Blog', 'FAQ', 'À propos']);
        // First level: thin grey icon + vertical hairline before the label (ui.sh variant « Hairline verticale »).
        links.slice(0, 3).forEach((l) => {
            expect(l.querySelector('svg')).not.toBeNull();
            expect(l.querySelector('span[aria-hidden].w-px')).not.toBeNull();
        });
        links.slice(3).forEach((l) => expect(l.querySelector('svg')).toBeNull());
        links.slice(0, 3).forEach((l) => expect(l).toHaveClass('font-medium')); // first level in medium, secondary stays regular
        links.slice(3).forEach((l) => expect(l).not.toHaveClass('font-medium'));
        expect(links[2]).toHaveTextContent('Estimer mon bienSous 24 h'); // action label + nudge badge on the valuation entry
        expect(within(links[2]).getByText('Sous 24 h')).toHaveClass('rounded-none', 'bg-background-08'); // square sand badge (ui.sh variant « Carré sable »)
        // Stack unfold: every row animates in, staggered 35 ms apart.
        const rows = links.map((l) => l.parentElement!);
        rows.forEach((li) => expect(li).toHaveClass('animate-menu-in'));
        expect(rows[0].style.getPropertyValue('--stagger')).toBe('0ms');
        expect(rows[1].style.getPropertyValue('--stagger')).toBe('35ms');

        // Secondary links sit in a sand gradient well (ui.sh variant « Dégradé sable »).
        expect(links[3].closest('ul')).toHaveClass('from-background-08', 'bg-linear-to-b');
        expect(links[2].querySelector('svg')).toHaveClass('lucide-house');
        links.forEach((l) => expect(l).not.toHaveClass('after:h-px')); // plain hover, no drawn underline
        links.slice(0, 3).forEach((l) => expect(l).toHaveClass('hover:bg-background-05')); // first level: sand hover
        // Secondary links: white hover / current state on the sand well (user decision 2026-09-16).
        links.slice(3).forEach((l) => {
            expect(l).toHaveClass('hover:bg-card', 'aria-[current=page]:bg-card');
            expect(l).not.toHaveClass('hover:bg-background-05');
        });
        // The CTA + language links follow the nav directly (not pinned with mt-auto): the contact button is the panel's next link after the nav.
        const cta = within(mobileNav.parentElement!).getByRole('link', { name: 'Nous contacter' });
        expect(cta.closest('.mt-auto')).toBeNull();

        // A tap on the blurred veil around the panel closes the menu at once (rows unmounted, no cascade on the way out).
        const veil = mobileNav.parentElement!.parentElement!;
        expect(veil).toHaveClass('backdrop-blur-md');
        await user.click(veil);
        expect(screen.getByRole('button', { name: 'Ouvrir le menu' })).toHaveAttribute('aria-expanded', 'false');
        expect(within(mobileNav.parentElement!).queryByRole('link', { name: 'Nous contacter' })).toBeNull();
    });
});
