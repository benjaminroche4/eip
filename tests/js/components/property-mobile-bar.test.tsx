import PropertyMobileBar from '@/components/properties/property-mobile-bar';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { PROPERTY } from '../fixtures/property';
import { page, renderPage, sharedProps } from '../inertia';

const ADVISOR = { id: 1, photo: '/images/advisors/advisor-1.webp', name: 'Alexandre Moreau', role: 'Conseiller senior' };

describe('PropertyMobileBar', () => {
    it('is fixed to the screen bottom from the start with the price and the price per m², and the whole bar opens the advisor card in a sheet', async () => {
        page.props = sharedProps();
        const user = userEvent.setup();
        const { container, rerender } = renderPage(<PropertyMobileBar property={PROPERTY} advisor={ADVISOR} reference="AP-6" />);

        // Less in the bar (2026-09-30): the price, the price per m² and the chevron; no visit link, no availability
        expect(screen.queryByRole('link', { name: 'Demander une visite' })).toBeNull();
        expect(screen.queryByText('Disponible')).toBeNull();
        expect(screen.getByText('2 450 000 €')).toBeInTheDocument();
        expect(screen.getByText('19 141 €/m²')).toBeInTheDocument();
        expect(screen.queryByRole('complementary')).toBeNull(); // the card waits in the sheet

        // The whole bar is the trigger: it opens the card above the bar; Escape closes it and gives the focus back
        const toggle = screen.getByRole('button', { name: 'Voir le détail du bien et du conseiller' });
        expect(toggle.parentElement).toHaveClass('fixed', 'bottom-0', 'z-60', 'lg:hidden');
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await user.click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        const sheet = screen.getByRole('dialog', { name: 'Votre conseiller' });
        expect(sheet).toHaveFocus(); // the sheet itself, never its first button (its tooltip used to open on focus, bug 2026-09-30)
        expect(screen.queryByRole('tooltip')).toBeNull();
        const card = within(sheet).getByRole('complementary', { name: 'Votre conseiller' });
        expect(within(card).getByText('Alexandre Moreau')).toBeInTheDocument();
        expect(within(card).getByText('19 141 €/m²')).toBeInTheDocument(); // the card's own copy
        expect(within(card).getByRole('button', { name: 'Demander une visite' })).toHaveAttribute('aria-haspopup', 'dialog');
        expect(await axe(container)).toHaveNoViolations();
        sheet.focus(); // jsdom does not move the focus into a non-modal sheet as browsers do
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(toggle).toHaveFocus();

        rerender(<PropertyMobileBar property={{ ...PROPERTY, transaction: 'rent', price: 6500 }} advisor={ADVISOR} reference="AP-6" />);
        expect(screen.getByText(/6 500 €/)).toHaveTextContent('/ mois'); // rental: monthly
    });

    it('leaves once the block it stops at (the similar listings) is in view or scrolled past, and comes back below it (2026-09-30)', () => {
        const callbacks: IntersectionObserverCallback[] = [];
        const nativeObserver = globalThis.IntersectionObserver;
        globalThis.IntersectionObserver = class {
            constructor(cb: IntersectionObserverCallback) {
                callbacks.push(cb);
            }
            observe() {}
            disconnect() {}
        } as unknown as typeof IntersectionObserver;
        page.props = sharedProps();
        const end = document.createElement('section');
        document.body.appendChild(end);
        renderPage(<PropertyMobileBar property={PROPERTY} advisor={ADVISOR} reference="AP-6" until={{ current: end }} />);
        expect(screen.getByRole('button', { name: 'Voir le détail du bien et du conseiller' })).toBeInTheDocument();
        const entry = (isIntersecting: boolean, top: number) => [
            { target: end, isIntersecting, boundingClientRect: { top } as DOMRectReadOnly } as IntersectionObserverEntry,
        ];
        act(() => callbacks[0](entry(true, 700), {} as IntersectionObserver));
        expect(screen.queryByRole('button', { name: 'Voir le détail du bien et du conseiller' })).toBeNull();
        act(() => callbacks[0](entry(false, 2000), {} as IntersectionObserver));
        expect(screen.getByRole('button', { name: 'Voir le détail du bien et du conseiller' })).toBeInTheDocument();
        globalThis.IntersectionObserver = nativeObserver;
        end.remove();
    });
});
