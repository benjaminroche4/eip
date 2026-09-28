import EmptyResults from '@/components/properties/empty-results';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderPage } from '../inertia';

describe('EmptyResults', () => {
    it('offers to widen to the neighbouring arrondissements or the budget, and to clear everything', async () => {
        const user = userEvent.setup();
        const districts = vi.fn();
        const budget = vi.fn();
        const reset = vi.fn();
        const { rerender } = renderPage(<EmptyResults onWidenDistricts={districts} onWidenBudget={budget} onReset={reset} />);
        expect(screen.getByRole('status')).toHaveTextContent('Élargissez votre recherche');
        await user.click(screen.getByRole('button', { name: 'Inclure les arrondissements voisins' }));
        await user.click(screen.getByRole('button', { name: 'Augmenter le budget de 20 %' }));
        await user.click(screen.getByRole('button', { name: 'Tout effacer' }));
        expect(districts).toHaveBeenCalled();
        expect(budget).toHaveBeenCalled();
        expect(reset).toHaveBeenCalled();
        rerender(<EmptyResults onReset={reset} />); // nothing to widen: only the clear button
        expect(screen.queryByRole('button', { name: 'Inclure les arrondissements voisins' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Augmenter le budget de 20 %' })).toBeNull();
    });
});
