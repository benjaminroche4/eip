import OffMarketGate from '@/components/properties/off-market-gate';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { formErrors, formPost, page, renderPage, sharedProps } from '../inertia';

/** The six-digit access code field of the off-market gate (user decision 2026-09-29). */
describe('OffMarketGate', () => {
    beforeEach(() => {
        // `input-otp` reads the element under the pointer on mouse events; jsdom has no layout
        document.elementFromPoint ??= () => null;
        formPost.mockClear();
        for (const key of Object.keys(formErrors)) delete formErrors[key];
    });

    it('takes six digits only, posts the code to the unlock route on the sixth digit, and links to the contact page', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        const { container } = renderPage(<OffMarketGate />);
        const field = screen.getByLabelText("Code d'accès");
        expect(field).toHaveAttribute('inputmode', 'numeric');
        expect(field).toHaveAttribute('autocomplete', 'one-time-code');
        expect(field).toHaveAccessibleDescription('6 chiffres, communiqués par votre conseiller.');
        expect(screen.getAllByLabelText(/Chiffre \d sur 6/)).toHaveLength(6); // one square cell per digit
        expect(screen.getByLabelText('Chiffre 1 sur 6')).not.toHaveClass('rounded-l-md'); // the site's square corners

        await user.type(field, '12a34');
        expect(field).toHaveValue('1234'); // letters are refused
        expect(formPost).not.toHaveBeenCalled();
        await user.type(field, '56');
        expect(formPost).toHaveBeenCalledWith('/off_market.unlock', expect.objectContaining({ preserveScroll: true })); // auto-submit on the sixth digit

        expect(screen.getByRole('button', { name: 'Déverrouiller' })).toHaveAttribute('type', 'submit');
        expect(screen.getByRole('link', { name: "Demander un code d'accès" })).toHaveAttribute('href', '/contact');
        expect(await axe(container)).toHaveNoViolations();
    });

    it('shows the server error under the field, tied to it', () => {
        formErrors.code = "Ce code n'ouvre pas l'accès.";
        page.props = sharedProps();
        renderPage(<OffMarketGate />);
        const field = screen.getByLabelText("Code d'accès");
        expect(field).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByRole('alert')).toHaveTextContent("Ce code n'ouvre pas l'accès.");
        expect(field.getAttribute('aria-describedby')).toContain(screen.getByRole('alert').id);
    });
});
