import MapPreview from '@/components/properties/map-preview';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { PROPERTY } from '../fixtures/property';
import { renderPage } from '../inertia';

describe('MapPreview', () => {
    it('shows the essentials of the chosen property, takes the focus, closes on Escape or the cross, and jumps to the full card', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        const onShow = vi.fn();
        const { container } = renderPage(<MapPreview property={PROPERTY} onClose={onClose} onShow={onShow} />);

        const dialog = screen.getByRole('dialog', { name: PROPERTY.title });
        expect(dialog).toHaveFocus();
        expect(dialog).toHaveTextContent('2 450 000 €');
        expect(dialog).toHaveTextContent('Paris 6e · 2 chambres · 128 m²');
        expect(screen.getByRole('img', { name: PROPERTY.photo_alt })).toHaveAttribute('src', '/images/buy/district-1-800.webp');

        await user.keyboard('{Escape}');
        expect(onClose).toHaveBeenCalledTimes(1);
        await user.click(screen.getByRole('button', { name: "Fermer l'aperçu" }));
        expect(onClose).toHaveBeenCalledTimes(2);
        // « Voir le bien » is a real link to the detail page (2026-09-28); the click still tells the page (map view closes)
        const show = screen.getByRole('link', { name: 'Voir le bien' });
        expect(show).toHaveAttribute('href', `/nos-biens/${PROPERTY.slug}`);
        await user.click(show);
        expect(onShow).toHaveBeenCalledWith(PROPERTY.slug);
        expect(await axe(container)).toHaveNoViolations();
    });

    it('adds « / mois » to a rent', () => {
        renderPage(<MapPreview property={{ ...PROPERTY, transaction: 'rent', price: 6500 }} onClose={vi.fn()} onShow={vi.fn()} />);
        expect(screen.getByRole('dialog')).toHaveTextContent('6 500 € / mois');
    });
});
