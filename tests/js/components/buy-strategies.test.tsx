import BuyStrategies, { type BuyStrategy } from '@/components/buy/buy-strategies';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const ITEMS: BuyStrategy[] = [
    { title: 'Plus-value', text: 'Acquérez des biens de prestige.' },
    { title: 'Investissement locatif', text: 'Construisez des revenus réguliers.' },
    { title: 'Opportunités hors marché', text: 'Accédez à des biens confidentiels.' },
];

describe('BuyStrategies', () => {
    const nativeObserver = globalThis.IntersectionObserver;
    afterEach(() => {
        globalThis.IntersectionObserver = nativeObserver;
    });

    it('renders the centred header, the bare photo and the three numbered strategies', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<BuyStrategies items={ITEMS} />);

        expect(screen.getByRole('heading', { level: 2, name: 'Des stratégies conçues autour de vos objectifs' })).toBeInTheDocument();
        expect(screen.getByText("Opportunités d'investissement")).toBeInTheDocument();
        const photos = container.querySelectorAll('img');
        expect(photos).toHaveLength(3); // one per strategy
        expect(photos[0]).toHaveAttribute('src', '/images/buy/strategies-1-1600.jpg');
        expect(photos[0]).toHaveAccessibleName(/tour Eiffel/);
        expect(photos[1]).toHaveAttribute('alt', ''); // the others are decorative and desktop-only
        expect(photos[1]).toHaveClass('hidden', 'lg:block', 'opacity-0');
        expect(container.querySelectorAll('ul')).toHaveLength(0); // no sentence, no check points over the photo

        const strategies = within(container.querySelector('ol')!).getAllByRole('listitem');
        expect(strategies).toHaveLength(3);
        expect(within(strategies[2]).getByRole('heading', { level: 3, name: 'Opportunités hors marché' })).toBeInTheDocument();
        expect(strategies[2]).toHaveTextContent(/^03/); // sand number like the About values
        expect(container.querySelector('ol')?.className).not.toMatch(/rounded-|shadow/);
        expect(container.querySelectorAll('a')).toHaveLength(0);
        expect(screen.getAllByRole('button')).toHaveLength(3); // each row activates its strategy

        expect(await axe(container)).toHaveNoViolations();
    });

    it('locks the number of the strategy that reaches the middle of the viewport (nothing active before scrolling)', () => {
        const callbacks: IntersectionObserverCallback[] = [];
        globalThis.IntersectionObserver = class {
            constructor(cb: IntersectionObserverCallback) {
                callbacks.push(cb);
            }
            observe() {}
            disconnect() {}
        } as unknown as typeof IntersectionObserver;
        page.props = sharedProps();
        const { container } = renderPage(<BuyStrategies items={ITEMS} />);
        const rows = Array.from(container.querySelectorAll('ol > li'));

        expect(container.querySelector('.animate-value-lock')).toBeNull();
        expect(screen.queryByTestId('strategy-ring')).toBeNull();

        act(() => callbacks[0]([{ isIntersecting: true, target: rows[1] } as IntersectionObserverEntry], {} as IntersectionObserver));

        expect(rows[1].querySelector('.animate-value-lock')).not.toBeNull();
        expect(rows[0].querySelector('.animate-value-lock')).toBeNull();
        expect(within(rows[1] as HTMLElement).getByTestId('strategy-ring')).toHaveAttribute('aria-hidden');
        const photos = container.querySelectorAll('img');
        expect(photos[1]).toHaveClass('opacity-100'); // the photo follows the active strategy
        expect(photos[0]).toHaveClass('lg:opacity-0');
    });

    it('activates a strategy on click and with the keyboard, in addition to the scroll', async () => {
        page.props = sharedProps();
        const user = userEvent.setup();
        const { container } = renderPage(<BuyStrategies items={ITEMS} />);
        const buttons = screen.getAllByRole('button');

        await user.click(buttons[2]);
        expect(buttons[2]).toHaveAttribute('aria-current', 'true');
        expect(buttons[0]).not.toHaveAttribute('aria-current');
        expect(container.querySelectorAll('img')[2]).toHaveClass('opacity-100');

        await user.tab({ shift: true });
        await user.tab({ shift: true }); // from the clicked third row back to the first one
        expect(buttons[0]).toHaveFocus();
        await user.keyboard('{Enter}');
        expect(buttons[0]).toHaveAttribute('aria-current', 'true');
        expect(buttons[2]).not.toHaveAttribute('aria-current');
    });
});
