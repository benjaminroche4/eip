import DistrictPicker from '@/components/districts/district-picker';
import { type District } from '@/components/districts/paris-map';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const ITEMS: District[] = Array.from({ length: 3 }, (_, i) => ({
    n: i + 1,
    name: `Paris ${i + 1}e`,
    areas: `Quartier ${i + 1}`,
    profile: 'Familles',
    price: `${10 + i} 000`,
    extra: '',
    positives: [],
    audience: '',
    housing: '',
    summary: '',
    metro: ['1'],
    rer: [],
    stations: [],
    attractions: [],
    dining: [],
    parks: [],
    education: [],
}));

describe('DistrictPicker', () => {
    it('names the selected arrondissement, browses with the arrows and stops at both ends (aria-disabled, focus kept)', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        const onSelect = vi.fn();
        const { container, rerender } = renderPage(<DistrictPicker items={ITEMS} selected={null} onSelect={onSelect} />);

        const trigger = screen.getByRole('combobox', { name: 'Choisir un arrondissement' });
        expect(trigger).toHaveTextContent('Tous les arrondissements');
        expect(trigger).toHaveClass('flex-1', 'min-w-0'); // shares one line with the arrows on mobile (2026-09-25)
        expect(trigger.parentElement).not.toHaveClass('flex-wrap');
        const previous = screen.getByRole('button', { name: 'Arrondissement précédent' });
        const next = screen.getByRole('button', { name: 'Arrondissement suivant' });
        expect(previous).toHaveAttribute('aria-disabled', 'true'); // nothing selected: no previous…
        expect(next).toHaveAttribute('aria-disabled', 'false'); // …but « next » opens the first profile
        await user.click(previous);
        expect(onSelect).not.toHaveBeenCalled();
        await user.click(next);
        expect(onSelect).toHaveBeenLastCalledWith(1);

        rerender(<DistrictPicker items={ITEMS} selected={2} onSelect={onSelect} />);
        expect(trigger).toHaveTextContent('Paris 2e · Quartier 2');
        await user.click(screen.getByRole('button', { name: 'Arrondissement précédent' }));
        expect(onSelect).toHaveBeenLastCalledWith(1);
        await user.click(screen.getByRole('button', { name: 'Arrondissement suivant' }));
        expect(onSelect).toHaveBeenLastCalledWith(3);

        rerender(<DistrictPicker items={ITEMS} selected={3} onSelect={onSelect} />);
        const last = screen.getByRole('button', { name: 'Arrondissement suivant' });
        expect(last).toHaveAttribute('aria-disabled', 'true');
        expect(last).not.toBeDisabled(); // the focus can still land on it
        onSelect.mockClear();
        await user.click(last);
        expect(onSelect).not.toHaveBeenCalled();

        expect(await axe(container)).toHaveNoViolations();
    });
});
