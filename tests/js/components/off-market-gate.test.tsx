import OffMarketGate from '@/components/properties/off-market-gate';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { formErrors, formPost, page, renderPage, sharedProps } from '../inertia';

/** The four-digit access code field of the off-market gate (user decision 2026-09-29). */
describe('OffMarketGate', () => {
    beforeEach(() => {
        // `input-otp` reads the element under the pointer on mouse events; jsdom has no layout
        document.elementFromPoint ??= () => null;
        formPost.mockClear();
        for (const key of Object.keys(formErrors)) delete formErrors[key];
    });

    it('takes four digits only, posts the code to the unlock route on the fourth digit, and links to the contact page', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        const { container } = renderPage(<OffMarketGate />);
        const field = screen.getByLabelText("Code d'accès");
        expect(field).toHaveAttribute('inputmode', 'numeric');
        expect(field).toHaveAttribute('autocomplete', 'one-time-code');
        expect(field).toHaveAccessibleDescription('4 chiffres, communiqués par votre conseiller.');
        const cells = container.querySelectorAll('[data-slot="input-otp-slot"]');
        expect(cells).toHaveLength(4); // one square cell per digit, decorative (the real input carries the label)
        expect(cells[0]).not.toHaveClass('rounded-l-md'); // the site's square corners

        await user.type(field, '12a3');
        expect(field).toHaveValue('123'); // letters are refused
        expect(formPost).not.toHaveBeenCalled();
        await user.type(field, '4');
        expect(formPost).toHaveBeenCalledTimes(1); // submitted by itself on the fourth digit, once (user decision 2026-10-14)
        expect(formPost).toHaveBeenCalledWith('/off_market.unlock', expect.objectContaining({ preserveScroll: true, onError: expect.any(Function) }));
        // The submit button never re-sends the code the effect just posted; after a refusal the same code can be sent again
        await user.click(screen.getByRole('button', { name: 'Déverrouiller' }));
        expect(formPost).toHaveBeenCalledTimes(1);
        (formPost.mock.calls[0][1] as { onError: () => void }).onError();
        await user.type(field, '1234');
        expect(formPost).toHaveBeenCalledTimes(2);
        await user.clear(field);
        await user.type(field, '123');
        await user.click(screen.getByRole('button', { name: 'Déverrouiller' }));
        expect(formPost).toHaveBeenCalledTimes(2);

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
