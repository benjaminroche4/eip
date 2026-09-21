import BuyAdvantages from '@/components/buy/buy-advantages';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

describe('BuyAdvantages', () => {
    it('renders the question header, four numbered cards and the contact button as the only focusable element', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<BuyAdvantages />);

        expect(screen.getByRole('heading', { level: 2, name: 'Pourquoi acheter avec Estate in Paris ?' })).toBeInTheDocument();
        expect(screen.getByText(/Estate in Paris associe/)).toBeInTheDocument(); // GEO answer-first intro
        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(4);
        expect(within(items[0]).getByRole('heading', { level: 3, name: 'Sourcing de biens' })).toBeInTheDocument();
        expect(within(items[3]).getByRole('heading', { level: 3, name: 'Acheteurs internationaux' })).toBeInTheDocument();
        expect(items[3]).toHaveTextContent('04'); // sand numbering, like the About values
        expect(items[0].querySelector('svg')).toHaveAttribute('aria-hidden'); // watermark + tile icons are decorative
        expect(items[0].className).toMatch(/animate-hero-rise|opacity-0/); // cascade on reveal

        const cta = screen.getByRole('link', { name: 'Parler à un conseiller' });
        expect(cta).toHaveAttribute('href', '/contact');
        await userEvent.tab();
        expect(cta).toHaveFocus();
        expect(container.querySelectorAll('a, button')).toHaveLength(1);

        expect(await axe(container)).toHaveNoViolations();
    });
});
