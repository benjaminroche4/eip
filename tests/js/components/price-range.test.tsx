import PriceRange, { rangeOf, RollingAmount } from '@/components/properties/price-range';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderPage } from '../inertia';

const BOUNDS = { sale: { min: 1_100_000, max: 4_300_000 }, rent: { min: 3_200, max: 6_900 } };

describe('PriceRange', () => {
    it('runs from the cheapest to the dearest listing, rounded outward to a round step', () => {
        expect(rangeOf(BOUNDS.sale)).toEqual({ min: 1_100_000, max: 4_300_000, step: 50_000 });
        expect(rangeOf(BOUNDS.rent)).toEqual({ min: 3_200, max: 6_900, step: 50 });
        expect(rangeOf({ min: 1_234_567, max: 2_000_000 })).toEqual({ min: 1_230_000, max: 2_000_000, step: 5_000 });
        expect(rangeOf({ min: 0, max: 0 })).toEqual({ min: 0, max: 1, step: 1 }); // no listing: still a valid slider
    });

    it('shows the budget in large digits driven by a two-thumb slider, the cheapest / dearest price at the bounds, quick amounts as pills', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const { rerender } = renderPage(<PriceRange transaction="sale" bounds={BOUNDS} min="" max="" onChange={onChange} />);
        // At the bounds the cheapest and dearest listings' prices show (user decision 2026-09-28), visible (rolling digits) + sr-only
        const fr = (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`;
        expect(screen.getByText(fr(BOUNDS.sale.min))).toHaveClass('sr-only');
        expect(screen.getByText(fr(BOUNDS.sale.max))).toHaveClass('sr-only');
        expect(screen.queryByText('Sans minimum')).toBeNull();
        const minThumb = screen.getByRole('slider', { name: 'Budget minimum' });
        const maxThumb = screen.getByRole('slider', { name: 'Budget maximum' });
        expect(minThumb).toHaveAttribute('aria-valuenow', '1100000'); // the cheapest listing
        expect(maxThumb).toHaveAttribute('aria-valuenow', '4300000'); // the dearest

        maxThumb.focus();
        await user.keyboard('{ArrowLeft}');
        expect(onChange).toHaveBeenLastCalledWith('', '4 250 000'); // one step down, grouped
        minThumb.focus();
        await user.keyboard('{ArrowRight}');
        expect(onChange).toHaveBeenLastCalledWith('1 150 000', '');

        await user.click(within(screen.getByRole('group', { name: 'Montants fréquents' })).getByRole('button', { name: '< 2 000 000' }));
        expect(onChange).toHaveBeenLastCalledWith('', '2 000 000');

        rerender(<PriceRange transaction="sale" bounds={BOUNDS} min="1 400 000" max="2 000 000" onChange={onChange} />);
        expect(screen.getByRole('status')).toHaveTextContent('Budget de 1 400 000 € à 2 000 000 €');
        expect(screen.getAllByRole('slider')[1]).toHaveAttribute('aria-valuenow', '2000000');
        rerender(<PriceRange transaction="rent" bounds={BOUNDS} min="" max="6 000" onChange={onChange} />);
        expect(screen.getAllByRole('slider')[1]).toHaveAttribute('aria-valuemax', '6900'); // rental bounds
    });

    it('rolls each changed digit like a slot machine', () => {
        const { rerender, container } = renderPage(<RollingAmount value="1 500 000 €" direction={null} />);
        expect(container.querySelectorAll('.animate-slot-in-up')).toHaveLength(0);
        rerender(<RollingAmount value="1 550 000 €" direction="up" />);
        expect(container.querySelectorAll('.animate-slot-out-up')).toHaveLength(1); // only the changed digit leaves
        expect(container.querySelectorAll('.animate-slot-in-up').length).toBeGreaterThan(0);
    });
});
