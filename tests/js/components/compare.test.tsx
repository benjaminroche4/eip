import CompareTray from '@/components/properties/compare';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PROPERTY } from '../fixtures/property';
import { renderPage } from '../inertia';

const A = { ...PROPERTY, features: ['elevator', 'view'], condition: 'renovated', floor: 3, price_sqm: 19141 };
const B = {
    ...PROPERTY,
    slug: 'loft-3e',
    title: 'Loft, Haut Marais',
    arrondissement: 3,
    area: 'Haut Marais',
    price: 1650000,
    surface: 118,
    rooms: 3,
    bedrooms: 2,
    features: ['quiet'],
    condition: 'to_renovate',
    floor: 0,
    price_sqm: 13983,
};

describe('CompareTray', () => {
    it('pins a tray while listings are ticked, and compares them side by side in a dialog', async () => {
        const user = userEvent.setup();
        const remove = vi.fn();
        const clear = vi.fn();
        const { rerender } = renderPage(<CompareTray properties={[A]} onRemove={remove} onClear={clear} />);
        const tray = screen.getByRole('region', { name: 'Comparer les biens' });
        expect(tray).toHaveTextContent('1 bien à comparer');
        expect(within(tray).getByRole('button', { name: 'Comparer' })).toBeDisabled(); // two at least

        rerender(<CompareTray properties={[A, B]} onRemove={remove} onClear={clear} />);
        await user.click(within(screen.getByRole('region', { name: 'Comparer les biens' })).getByRole('button', { name: 'Comparer' }));
        const dialog = await screen.findByRole('dialog', { name: 'Comparer les biens' });
        expect(within(dialog).getAllByRole('columnheader')).toHaveLength(2);
        expect(within(dialog).getByRole('row', { name: /Prix au m²/ })).toHaveTextContent(/19.141.€\/m²13.983.€\/m²$/); // one « € » only, thousands grouped by the locale's own space
        expect(within(dialog).getByRole('row', { name: /Étage/ })).toHaveTextContent('3e');
        expect(within(dialog).getByRole('row', { name: /Étage/ })).toHaveTextContent('Rez-de-chaussée');
        expect(within(dialog).getByRole('row', { name: /Ascenseur/ })).toHaveTextContent('OuiNon'); // a check for A, a dash for B
        await user.click(within(dialog).getByRole('button', { name: 'Ne plus comparer Loft, Haut Marais' }));
        expect(remove).toHaveBeenCalledWith('loft-3e');

        rerender(<CompareTray properties={[]} onRemove={remove} onClear={clear} />);
        expect(screen.queryByRole('region', { name: 'Comparer les biens' })).toBeNull();
    });
});
