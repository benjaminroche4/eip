import EstimateForm from '@/components/estimate/estimate-form';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { formErrors, formPost, page, renderPage, sharedProps } from '../inertia';

const { fetchAutocompleteSuggestions, loadPlaces } = vi.hoisted(() => {
    const fetchAutocompleteSuggestions = vi.fn();
    return {
        fetchAutocompleteSuggestions,
        loadPlaces: vi.fn(() =>
            Promise.resolve({
                AutocompleteSessionToken: class {},
                AutocompleteSuggestion: { fetchAutocompleteSuggestions },
            }),
        ),
    };
});

vi.mock('@/lib/google-places', () => ({ loadPlaces }));

const prediction = (placeId: string, main: string, secondary: string) => ({
    placePrediction: { placeId, text: { text: `${main}, ${secondary}` }, mainText: { text: main }, secondaryText: { text: secondary } },
});

const render = (googleMapsKey: string | null = 'test-key') =>
    renderPage(
        <EstimateForm
            propertyTypes={['apartment']}
            contactMethods={['phone', 'whatsapp', 'email']}
            floors={['ground']}
            features={['bright']}
            conditions={['good']}
            googleMapsKey={googleMapsKey}
        />,
    );

describe('AddressAutocomplete', () => {
    beforeEach(() => {
        window.sessionStorage.clear();
        formPost.mockClear();
        loadPlaces.mockClear();
        fetchAutocompleteSuggestions.mockReset().mockResolvedValue({
            suggestions: [prediction('p1', '10 Rue de Rivoli', 'Paris, France'), prediction('p2', '10 Rue de Rennes', 'Paris, France')],
        });
        for (const key of Object.keys(formErrors)) delete formErrors[key];
        page.props = sharedProps();
    });

    it('suggests Google places while typing and fills the field on click', async () => {
        const user = userEvent.setup();
        const { container } = render();

        const input = screen.getByRole('combobox', { name: /Où se situe votre bien/ });
        await user.type(input, '10 rue');

        const options = await screen.findAllByRole('option');
        expect(options).toHaveLength(2);
        expect(options[0]).toHaveTextContent('10 Rue de Rivoli');
        expect(options[0]).toHaveTextContent('Paris, France');
        expect(input).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Suggestions Google')).toBeInTheDocument();
        expect(fetchAutocompleteSuggestions).toHaveBeenLastCalledWith(
            expect.objectContaining({ input: '10 rue', includedRegionCodes: ['fr'], language: 'fr' }),
        );
        expect(await axe(container)).toHaveNoViolations();

        await user.click(options[0]);
        expect(input).toHaveValue('10 Rue de Rivoli, Paris, France');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(input).toHaveFocus(); // picking a suggestion must not throw the keyboard user out of the field
    });

    it('is fully keyboard operable: arrows to choose, Enter to pick, Escape to close', async () => {
        const user = userEvent.setup();
        render();

        const input = screen.getByRole('combobox', { name: /Où se situe votre bien/ });
        await user.type(input, '10 rue');
        await screen.findByRole('listbox');

        await user.keyboard('{ArrowDown}{ArrowDown}');
        expect(input).toHaveAttribute('aria-activedescendant', 'address-suggestions-1');
        await user.keyboard('{Enter}');
        expect(input).toHaveValue('10 Rue de Rennes, Paris, France');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(formPost).not.toHaveBeenCalled(); // Enter picked the suggestion, it did not submit the form

        await user.type(input, ' bis');
        await screen.findByRole('listbox');
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    it('stays a plain input when no API key is configured', async () => {
        const user = userEvent.setup();
        render(null);

        const input = screen.getByRole('combobox', { name: /Où se situe votre bien/ });
        await user.type(input, '10 rue de Rivoli');
        expect(input).toHaveValue('10 rue de Rivoli');
        await waitFor(() => expect(loadPlaces).not.toHaveBeenCalled());
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
});
