import BuyStrategies, { type BuyStrategy } from '@/components/buy/buy-strategies';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const ITEMS: BuyStrategy[] = [
    { title: 'Plus-value', text: 'Acquérez des biens de prestige.' },
    { title: 'Investissement locatif', text: 'Construisez des revenus réguliers.' },
    { title: 'Opportunités hors marché', text: 'Accédez à des biens confidentiels.' },
];

describe('BuyStrategies', () => {
    afterEach(() => {
        vi.restoreAllMocks();
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

    it('locks the number of the strategy that reaches the middle of the viewport (nothing active before scrolling)', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<BuyStrategies items={ITEMS} />);
        const list = container.querySelector('ol')!;
        const rows = Array.from(container.querySelectorAll('ol > li'));

        expect(container.querySelector('.animate-value-lock')).toBeNull();
        expect(screen.queryByTestId('strategy-ring')).toBeNull();

        // Viewport 1000px high (middle line at 500): the second strategy sits under the middle line (measured on scroll).
        vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000);
        const rects = new Map<Element, [number, number]>([
            [list, [0, 1000]],
            [rows[0], [100, 300]],
            [rows[1], [400, 600]],
            [rows[2], [700, 900]],
        ]);
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
            const [top, bottom] = rects.get(this) ?? [0, 0];
            return { top, bottom, height: bottom - top, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
        });
        window.dispatchEvent(new Event('scroll'));
        await act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

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
