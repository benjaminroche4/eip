import StatValue from '@/components/page/stat-value';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('StatValue', () => {
    it('starts the count at `from` so a price rolls only over the difference with the previous one (2026-09-25)', () => {
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1); // frozen: the first paint shows the start value
        const { container } = render(<StatValue value="10 400 €" run from={10000} />);

        expect(screen.getByText('10 400 €')).toHaveClass('sr-only'); // accessible text = the final value from the start
        expect(container.querySelector('[aria-hidden]')).toHaveTextContent('10 000 €'); // the visible count begins at the previous price
        vi.restoreAllMocks();
    });

    it('counts from 0 by default and renders the final value straight away without a run', () => {
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
        const { container, rerender } = render(<StatValue value="250 M€+" run />);
        expect(container.querySelector('[aria-hidden]')).toHaveTextContent('0 M€+');
        rerender(<StatValue value="250 M€+" run={false} />);
        expect(container.querySelector('[aria-hidden]')).toHaveTextContent('250 M€+');
        vi.restoreAllMocks();
    });

    it('treats one or two digits after a separator as decimals: « 4,9/5 » reads 4,9, never 49 (Google rating tile, 2026-10-11)', () => {
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
        const { container, rerender } = render(<StatValue value="4,9/5" run />);
        expect(container.querySelector('[aria-hidden]')).toHaveTextContent('0,0/5');
        rerender(<StatValue value="4,9/5" run={false} />);
        expect(container.querySelector('[aria-hidden]')).toHaveTextContent('4,9/5');
        rerender(<StatValue value="4.9/5" run={false} />);
        expect(container.querySelector('[aria-hidden]')).toHaveTextContent('4.9/5');
        vi.restoreAllMocks();
    });
});
