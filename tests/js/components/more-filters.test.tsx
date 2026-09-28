import MoreFilters, { EMPTY_MORE } from '@/components/properties/more-filters';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

describe('MoreFilters', () => {
    it("offers the richer criteria as the bar's cells: amounts with quick pills, toggle pills, the rental terms only for rentals, the under-offer switch", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const { container, rerender } = renderPage(
            <MoreFilters value={EMPTY_MORE} onChange={onChange} transaction="sale" areas={['Passy', 'Marais']} />,
        );

        expect(screen.queryByRole('textbox', { name: 'Budget minimum' })).toBeNull(); // the price range on top of the modal carries it
        await user.type(screen.getByRole('textbox', { name: 'Surface minimale' }), '9');
        expect(onChange).toHaveBeenLastCalledWith({ surfaceMin: '9' });
        await user.click(within(screen.getByRole('group', { name: 'Surfaces fréquentes' })).getByRole('button', { name: '150' }));
        expect(onChange).toHaveBeenLastCalledWith({ surfaceMin: '150' });
        await user.click(within(screen.getByRole('group', { name: 'Chambres' })).getByRole('button', { name: '3 chambres' }));
        expect(onChange).toHaveBeenLastCalledWith({ bedrooms: [3] });
        await user.click(within(screen.getByRole('group', { name: 'Atouts' })).getByRole('button', { name: 'Ascenseur' }));
        expect(onChange).toHaveBeenLastCalledWith({ features: ['elevator'] });
        await user.click(within(screen.getByRole('group', { name: 'État' })).getByRole('button', { name: 'Neuf' }));
        expect(onChange).toHaveBeenLastCalledWith({ conditions: ['new'] });
        await user.click(within(screen.getByRole('group', { name: 'Étage' })).getByRole('button', { name: 'Dernier étage' }));
        expect(onChange).toHaveBeenLastCalledWith({ floors: ['top'] });
        await user.click(within(screen.getByRole('group', { name: 'Quartier' })).getByRole('button', { name: 'Passy' }));
        expect(onChange).toHaveBeenLastCalledWith({ areas: ['Passy'] });
        expect(screen.queryByRole('radiogroup', { name: 'Meublé' })).toBeNull(); // sales: no rental terms
        await user.click(screen.getByRole('button', { name: 'Masquer les biens sous offre' }));
        expect(onChange).toHaveBeenLastCalledWith({ availableOnly: true });
        expect(await axe(container)).toHaveNoViolations();

        rerender(<MoreFilters value={{ ...EMPTY_MORE, furnished: true }} onChange={onChange} transaction="rent" areas={[]} />);
        const furnished = screen.getByRole('radiogroup', { name: 'Meublé' });
        expect(within(furnished).getByRole('radio', { name: 'Meublé' })).toHaveAttribute('aria-checked', 'true');
        await user.click(within(furnished).getByRole('radio', { name: 'Non meublé' }));
        expect(onChange).toHaveBeenLastCalledWith({ furnished: false });
        expect(screen.queryByRole('group', { name: 'Quartier' })).toBeNull(); // no quartier known: no cell
    });
});
