import ActiveFilters from '@/components/properties/active-filters';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderPage } from '../inertia';

describe('ActiveFilters', () => {
    it('lists the criteria in force as chips with their « × » and a « Tout effacer », nothing when none is set', async () => {
        const user = userEvent.setup();
        const remove = vi.fn();
        const clear = vi.fn();
        const { rerender } = renderPage(
            <ActiveFilters
                filters={[
                    { key: 'a', label: 'Paris 6e', onRemove: remove },
                    { key: 'b', label: 'Zone', removeLabel: 'Retirer la zone', onRemove: vi.fn() },
                ]}
                onClear={clear}
            />,
        );
        const list = screen.getByRole('list', { name: 'Critères actifs' });
        expect(within(list).getAllByRole('listitem')).toHaveLength(2);
        await user.click(screen.getByRole('button', { name: 'Retirer Paris 6e' }));
        expect(remove).toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Retirer la zone' })).toBeInTheDocument(); // own wording
        await user.click(screen.getByRole('button', { name: 'Tout effacer' }));
        expect(clear).toHaveBeenCalled();
        rerender(<ActiveFilters filters={[]} onClear={clear} />);
        expect(screen.queryByRole('list')).toBeNull();
    });
});
