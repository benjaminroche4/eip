import PropertyCarousel from '@/components/home/property-carousel';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

describe('PropertyCarousel', () => {
    it('navigates the slides with the keyboard and disables the arrows at the ends', async () => {
        const user = userEvent.setup();
        const { container } = renderPage(<PropertyCarousel />);

        const prev = screen.getByRole('button', { name: 'Bien précédent' });
        const next = screen.getByRole('button', { name: 'Bien suivant' });
        expect(screen.getByText('Appartement élégant')).toBeInTheDocument();
        expect(screen.getByText('Off-market')).toBeInTheDocument();
        expect(prev).toBeDisabled();

        next.focus();
        await user.keyboard('{Enter}');
        expect(screen.getByText('Hôtel particulier')).toBeInTheDocument();
        expect(screen.queryByText('Off-market')).not.toBeInTheDocument(); // slide 2 is not off-market
        expect(prev).toBeEnabled();

        await user.keyboard('{Enter}{Enter}');
        expect(screen.getByText('Loft haussmannien')).toBeInTheDocument();
        expect(next).toBeDisabled();

        await user.click(prev);
        expect(screen.getByText('Penthouse avec terrasse')).toBeInTheDocument();

        expect(await axe(container)).toHaveNoViolations();
    });
});
