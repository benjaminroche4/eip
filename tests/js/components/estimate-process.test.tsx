import EstimateProcess from '@/components/estimate/estimate-process';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

describe('EstimateProcess', () => {
    it('answers « Comment se déroule une estimation ? » with three numbered, dated steps', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<EstimateProcess />);

        expect(screen.getByRole('heading', { level: 2, name: 'Comment se déroule une estimation ?' })).toBeInTheDocument();
        expect(screen.getByText(/Estate in Paris estime votre bien à Paris en trois étapes/)).toBeInTheDocument(); // GEO answer-first intro
        const steps = within(container.querySelector('ol')!).getAllByRole('listitem');
        expect(steps).toHaveLength(3);
        expect(steps[0]).toHaveTextContent('01');
        expect(within(steps[0]).getByRole('heading', { level: 3, name: 'Vous décrivez votre bien' })).toBeInTheDocument();
        expect(steps[1]).toHaveTextContent('Sous 24 heures ouvrées'); // the delay is stated
        expect(container.querySelectorAll('a, button')).toHaveLength(0);

        expect(await axe(container)).toHaveNoViolations();
    });
});
