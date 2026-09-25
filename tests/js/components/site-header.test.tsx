import SiteHeader from '@/components/layout/site-header';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

describe('SiteHeader', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it('renders the brand link, the main navigation and the CTA', () => {
        renderPage(<SiteHeader />);

        expect(screen.getByRole('link', { name: 'Homepage' })).toHaveAttribute('href', '/');
        const nav = screen.getByRole('navigation', { name: 'Navigation principale' });
        expect(within(nav).getAllByRole('link').length).toBeGreaterThanOrEqual(3);
        expect(screen.getByRole('link', { name: 'Nous contacter' })).toHaveAttribute('href', '/contact');
        expect(screen.getByRole('link', { name: 'Nous contacter' }).querySelector('[aria-hidden]')!.className).toMatch(/animate-sweep-shimmer/); // discreet light sweep
    });

    it('floats transparent over the hero on mobile (white logo and burger) until scrolled or the menu opens', async () => {
        const user = userEvent.setup();
        renderPage(<SiteHeader overlay />);
        const bar = screen.getByRole('banner').firstElementChild!;
        expect(bar).toHaveClass('max-lg:bg-transparent', 'max-lg:text-white');
        expect(screen.getByRole('button', { name: 'Ouvrir le menu' })).toHaveClass('hover:text-current'); // the burger keeps its colour on hover (no dark flash over the clip)
        const logo = screen.getByRole('link', { name: 'Homepage' });
        expect(logo.querySelector('img[src="/brand/logo_light_mobile.svg"]')).toHaveClass('block'); // white artwork below lg…
        expect(logo.querySelector('img[src="/brand/logo_dark_mobile.svg"]')).toHaveClass('hidden');
        expect(logo.querySelector('img[src="/brand/logo_light_desktop.svg"]')).toHaveClass('sm:max-lg:block'); // …tablet included

        await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' })); // menu open: the usual white bar
        expect(bar).not.toHaveClass('max-lg:bg-transparent');
        expect(bar).toHaveClass('bg-card');
        expect(logo.querySelector('img[src="/brand/logo_dark_mobile.svg"]')).not.toHaveClass('hidden');
        await user.keyboard('{Escape}');

        await act(async () => {
            window.scrollY = 200;
            window.dispatchEvent(new Event('scroll'));
            await new Promise((resolve) => requestAnimationFrame(resolve)); // the hook reads the scroll once per frame
        });
        expect(bar).not.toHaveClass('max-lg:bg-transparent'); // scrolled: white bar
        window.scrollY = 0;
    });

    it('stays a white card on the other pages (no overlay)', () => {
        renderPage(<SiteHeader />);
        expect(screen.getByRole('banner').firstElementChild).not.toHaveClass('max-lg:bg-transparent');
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

    it('makes the page behind the veil inert while the menu is open, so Tab never leaves the menu', async () => {
        const user = userEvent.setup();
        const main = document.createElement('main');
        main.id = 'main';
        main.innerHTML = '<a href="/x">Page link</a>';
        const footer = document.createElement('footer');
        footer.id = 'footer';
        document.body.append(main, footer);
        const { unmount } = renderPage(<SiteHeader />);

        await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
        expect(main).toHaveAttribute('inert');
        expect(footer).toHaveAttribute('inert');
        await user.keyboard('{Escape}');
        expect(main).not.toHaveAttribute('inert');
        expect(footer).not.toHaveAttribute('inert');

        await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
        expect(main).toHaveAttribute('inert');
        unmount(); // unmounting while open releases the page too
        expect(main).not.toHaveAttribute('inert');
        main.remove();
        footer.remove();
    });

    it('does not send the focus to the hidden toggle when the menu closes on a resize to desktop', async () => {
        const user = userEvent.setup();
        let onChange: ((e: { matches: boolean }) => void) | null = null;
        vi.spyOn(window, 'matchMedia').mockImplementation(
            (query: string) =>
                ({
                    matches: false,
                    media: query,
                    addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => (onChange = cb),
                    removeEventListener() {},
                }) as unknown as MediaQueryList,
        );
        renderPage(<SiteHeader />);
        const toggle = screen.getByRole('button', { name: 'Ouvrir le menu' });
        await user.click(toggle);
        expect(onChange).not.toBeNull();

        vi.spyOn(window, 'getComputedStyle').mockReturnValue({ display: 'none' } as CSSStyleDeclaration); // `lg:hidden` applies: the toggle is not displayed any more
        await act(() => onChange!({ matches: true }));
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(toggle).not.toHaveFocus();
        expect(document.body).toHaveFocus();
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
    it('lists the secondary links (blog, FAQ, about) with plain sand hover, then the CTA and the language links, without a top divider', async () => {
        const user = userEvent.setup();
        renderPage(<SiteHeader />);
        await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));

        const mobileNav = screen.getByRole('navigation', { name: 'Navigation mobile' });
        const links = within(mobileNav).getAllByRole('link');
        expect(links.slice(-3).map((l) => l.textContent)).toEqual(['Blog', 'FAQ', 'À propos']);
        // No divider between the bar and the first rows (tried and dropped the same day — user decision 2026-09-22)
        expect(mobileNav.querySelector(':scope > span[aria-hidden]')).toBeNull(); // no hairline under the bar (tried and dropped the same day — user decision 2026-09-22)
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
