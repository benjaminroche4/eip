import EstimateForm from '@/components/estimate/estimate-form';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { formErrors, formPost, page, renderPage, sharedProps } from '../inertia';

// This file renders the whole form (13 heavy tests, ~12 s in the full run): a 5 s per-test budget times out under load.
vi.setConfig({ testTimeout: 15000 });

const TYPES = ['apartment', 'duplex', 'studio', 'mansion', 'house', 'loft', 'building', 'other'];
const METHODS = ['phone', 'whatsapp', 'email'];
const FLOORS = ['ground', '1', '2', '3', '7_plus', 'top'];
const FEATURES = ['bright', 'view', 'quiet', 'outdoor', 'metro', 'central', 'parking', 'cellar'];
const CONDITIONS = ['renovate', 'good', 'new'];

const render = () =>
    renderPage(
        <EstimateForm
            propertyTypes={TYPES}
            contactMethods={METHODS}
            floors={FLOORS}
            features={FEATURES}
            conditions={CONDITIONS}
            googleMapsKey={null}
        />,
    );
const recap = () => within(screen.getByRole('complementary', { name: 'Votre demande' }));

describe('EstimateForm', () => {
    beforeEach(() => {
        window.sessionStorage.clear();
        formPost.mockClear();
        for (const key of Object.keys(formErrors)) delete formErrors[key];
        page.props = sharedProps();
    });

    it('renders the five steps, selection cards as radios, the new criteria and the required fields', () => {
        render();

        expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
            'Étape 1 1Quel type de bien possédez-vous ?',
            'Étape 2 2Qui contacter au sujet de cette estimation ?',
            'Étape 3 3Quelles sont les caractéristiques de votre bien ?',
            'Étape 4 4Comment souhaitez-vous être contacté ?',
            'Étape 5 5Y a-t-il autre chose à savoir ?',
            'Votre demande',
        ]);

        const types = within(screen.getByRole('radiogroup', { name: /Quel type de bien/ })).getAllByRole('radio');
        expect(types).toHaveLength(8);
        expect(types[0]).toHaveAccessibleName('Appartement');
        expect(types[0]).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('radio', { name: 'Téléphone' })).toHaveAttribute('aria-checked', 'true'); // French visitor → call

        for (const name of [
            'Nom complet',
            'Adresse e-mail',
            'Téléphone',
            'Où se situe votre bien',
            'Surface',
            'Nombre de pièces',
            'Nombre de chambres',
        ]) {
            expect(screen.getByLabelText(new RegExp(`^${name}`))).toHaveAttribute('aria-required', 'true');
        }
        expect(screen.getByRole('combobox', { name: /^Étage/ })).toHaveAttribute('aria-required', 'false');
        expect(screen.getByRole('combobox', { name: /^État général/ })).toHaveAttribute('aria-required', 'false');
        for (const name of ['Ascenseur', 'Lumineux', 'Proche métro', 'Hyper centre', 'Cave']) {
            expect(screen.getByRole('checkbox', { name })).not.toBeChecked();
        }
        expect(screen.getByLabelText(/^Téléphone/)).toHaveAttribute('autocomplete', 'tel');
        expect(screen.getByText('Confidentiel')).toBeInTheDocument();
        expect(screen.getByText('Votre demande est traitée par Maris Moreau')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'Demander mon estimation' })).toHaveLength(2); // form + mobile bar (CSS hides one)
    });

    it('informs about retention and links to the privacy policy under the consent box', () => {
        render();
        const box = screen.getByRole('checkbox', { name: /J'accepte/ });
        expect(box.getAttribute('aria-describedby')).toContain('consent-privacy');
        expect(screen.getByRole('link', { name: 'Politique de confidentialité' })).toHaveAttribute('href', '/politique-de-confidentialite');
        expect(document.getElementById('consent-privacy')).toHaveTextContent('3 ans');
    });

    it('lets you pick cards with the keyboard and count rooms with the steppers', async () => {
        const user = userEvent.setup();
        render();

        screen.getByRole('radio', { name: 'Appartement' }).focus();
        await user.keyboard('{ArrowRight}');
        expect(screen.getByRole('radio', { name: 'Duplex' })).toHaveFocus(); // roving focus (Radix checks on the real click it fires in browsers)
        await user.keyboard(' ');
        expect(screen.getByRole('radio', { name: 'Duplex' })).toHaveAttribute('aria-checked', 'true');

        const rooms = screen.getByLabelText(/^Nombre de pièces/);
        const [decrease, increase] = within(rooms.closest<HTMLElement>('[data-slot=stepper]')!).getAllByRole('button');
        expect(decrease).toHaveAttribute('aria-disabled', 'true'); // min 1 (aria-disabled: the button keeps the focus)
        await user.click(increase);
        await user.click(increase);
        expect(rooms).toHaveValue(3);
        await user.click(decrease);
        expect(rooms).toHaveValue(2);
        for (let i = 0; i < 12; i++) await user.click(increase);
        expect(rooms).toHaveValue(10); // capped at 10
        expect(increase).toHaveAttribute('aria-disabled', 'true');
        expect(increase).toHaveFocus(); // never `disabled`: reaching the end of the range does not throw the keyboard user out
        await user.keyboard('{Enter}');
        expect(rooms).toHaveValue(10); // a no-op at the end of the range
    });

    it('lets you clear the stepper and type a number directly (committed and clamped on blur)', async () => {
        const user = userEvent.setup();
        render();

        const rooms = screen.getByLabelText(/^Nombre de pièces/);
        await user.click(rooms);
        await user.clear(rooms);
        expect(rooms).toHaveValue(null); // an emptied field stays empty instead of snapping back to the minimum
        await user.type(rooms, '4');
        expect(rooms).toHaveValue(4);
        expect(recap().getByRole('button', { name: 'Modifier : Pièces' })).toHaveTextContent('4');
        await user.clear(rooms);
        await user.tab(); // leaving an empty field commits the minimum
        expect(rooms).toHaveValue(1);
        await user.click(rooms);
        await user.clear(rooms);
        await user.type(rooms, '15{Enter}'); // Enter commits too, clamped to the maximum
        expect(rooms).toHaveValue(10);
        expect(rooms).toHaveFocus();
    });

    it('keeps the bedrooms under the rooms: capped when typed, pulled down when the rooms decrease', async () => {
        const user = userEvent.setup();
        render();

        const rooms = screen.getByLabelText(/^Nombre de pièces/);
        const bedrooms = screen.getByLabelText(/^Nombre de chambres/);
        const [, moreRooms] = within(rooms.closest<HTMLElement>('[data-slot=stepper]')!).getAllByRole('button');
        const [, moreBedrooms] = within(bedrooms.closest<HTMLElement>('[data-slot=stepper]')!).getAllByRole('button');
        await user.click(moreRooms);
        await user.click(moreRooms); // rooms 3
        await user.click(moreBedrooms);
        await user.click(moreBedrooms);
        await user.click(moreBedrooms); // asks for 4, capped at the 3 rooms
        expect(bedrooms).toHaveValue(3);
        expect(moreBedrooms).toHaveAttribute('aria-disabled', 'true');
        expect(bedrooms).toHaveAttribute('max', '3');

        const [lessRooms] = within(rooms.closest<HTMLElement>('[data-slot=stepper]')!).getAllByRole('button');
        await user.click(lessRooms);
        await user.click(lessRooms); // rooms 1
        expect(rooms).toHaveValue(1);
        expect(bedrooms).toHaveValue(1); // pulled down with the rooms
    });

    it('rolls the stepper digit like a slot reel and keeps square buttons', async () => {
        const user = userEvent.setup();
        render();

        const rooms = screen.getByLabelText(/^Nombre de pièces/);
        const stepper = rooms.closest<HTMLElement>('[data-slot=stepper]')!;
        const [decrease, increase] = within(stepper).getAllByRole('button');
        expect(decrease).toHaveClass('rounded-none');
        expect(increase).toHaveClass('rounded-none');

        const reel = () => stepper.querySelector('[aria-hidden]:not(svg)')!;
        expect(reel().querySelector('.animate-slot-in-up')).toBeNull(); // no animation on mount

        await user.click(increase);
        expect(reel().querySelector('.animate-slot-in-up')).toHaveTextContent('2');
        expect(reel().querySelector('.animate-slot-out-up')).toHaveTextContent('1');

        await user.click(decrease);
        expect(reel().querySelector('.animate-slot-in-down')).toHaveTextContent('1');
        expect(reel().querySelector('.animate-slot-out-down')).toHaveTextContent('2');

        // Typing in the field hides the reel so the typed digits stay visible.
        await user.click(rooms);
        expect(reel()).toHaveClass('group-focus-within:hidden');
    });

    it('mirrors the typed values in the recap, formats the value and posts to the estimate route', async () => {
        const user = userEvent.setup();
        render();

        await user.type(screen.getByLabelText(/^Nom complet/), 'Jean Dupont');
        await user.type(screen.getByLabelText(/^Surface/), '12045'); // capped at three digits
        expect(screen.getByLabelText(/^Surface/)).toHaveValue('120');
        await user.type(screen.getByLabelText(/^Valeur estimée/), '1500000');
        await user.click(screen.getByRole('checkbox', { name: 'Ascenseur' }));
        await user.click(screen.getByRole('checkbox', { name: 'Lumineux' }));
        await user.click(screen.getByRole('checkbox', { name: 'Proche métro' }));
        await user.click(screen.getByRole('radio', { name: 'WhatsApp' }));
        await user.type(screen.getByLabelText(/^Informations complémentaires/), 'Vue sur cour.');
        await user.click(screen.getByRole('checkbox', { name: /J'accepte d'être contacté/ }));
        await user.type(screen.getByLabelText(/^Adresse e-mail/), 'jean@example.com');
        await user.type(screen.getByLabelText(/^Téléphone/), '612345678');
        await user.type(screen.getByLabelText(/^Où se situe votre bien/), '12 rue de Seine, Paris');

        expect(screen.getByLabelText(/^Valeur estimée/)).toHaveValue((1500000).toLocaleString('fr-FR'));
        expect(screen.getByText(/Nous vous écrirons sur WhatsApp/)).toBeInTheDocument();
        expect(recap().getByText('Jean Dupont')).toBeInTheDocument();
        expect(recap().getByText('120 m²')).toBeInTheDocument();
        expect(recap().getByText('Ascenseur')).toBeInTheDocument();
        expect(recap().getByRole('button', { name: 'Modifier : Atouts' })).toHaveTextContent('2 : Lumineux, Proche métro'); // count + accessible names
        expect(recap().getByText('WhatsApp')).toBeInTheDocument();
        expect(recap().getByRole('button', { name: 'Modifier : Valeur' })).toHaveTextContent(/1.500.000 €/); // Intl uses narrow no-break spaces
        expect(screen.getByText('13/2000')).toBeInTheDocument();

        await user.click(screen.getAllByRole('button', { name: 'Demander mon estimation' })[0]);
        expect(formPost).toHaveBeenCalledWith('/estimate.store', expect.objectContaining({ preserveScroll: true }));
    });

    it('focuses the field from the recap line', async () => {
        const user = userEvent.setup();
        render();

        await user.click(recap().getByRole('button', { name: 'Modifier : Surface' }));
        expect(screen.getByLabelText(/^Surface/)).toHaveFocus();
    });

    it('summarises server-side errors and focuses the first one (the recap stays clean)', () => {
        formErrors.surface = 'La surface doit être supérieure à 5.';
        formErrors.consent = 'Votre accord est nécessaire.';
        render();

        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('2 champs à corriger');
        expect(
            within(alert)
                .getAllByRole('link')
                .map((a) => a.textContent),
        ).toEqual(['La surface doit être supérieure à 5.', 'Votre accord est nécessaire.']);
        expect(screen.getByLabelText(/^Surface/)).toHaveFocus();
        expect(screen.getByLabelText(/^Surface/)).toHaveAttribute('aria-invalid', 'true');
        expect(recap().getByRole('button', { name: 'Modifier : Surface' })).toHaveTextContent('Surface—');
    });

    it('turns a group into a check, moves the progress line and validates fields as they come in', async () => {
        const user = userEvent.setup();
        render();

        const progress = screen.getByRole('progressbar', { name: 'Avancement de votre demande' });
        expect(progress).toHaveAttribute('aria-valuenow', '29'); // property type + contact method are preset (2/7)
        expect(recap().getAllByText('Complet')).toHaveLength(2);
        expect(screen.queryAllByText('Valide')).toHaveLength(0);

        await user.type(screen.getByLabelText(/^Nom complet/), 'Jean Dupont');
        await user.type(screen.getByLabelText(/^Adresse e-mail/), 'jean@example.com');
        await user.type(screen.getByLabelText(/^Téléphone/), '612345678');
        expect(progress).toHaveAttribute('aria-valuenow', '71');
        expect(recap().getAllByText('Complet')).toHaveLength(3); // the contact group is done
        expect(screen.getAllByText('Valide')).toHaveLength(2); // e-mail + phone
        expect(screen.getByRole('heading', { level: 2, name: /Qui contacter/ })).toHaveClass('text-foreground');
        expect(screen.getByRole('heading', { level: 2, name: /caractéristiques/ })).toHaveClass('text-muted-foreground');
    });

    it('moves the focus to the next question after a card is picked', async () => {
        const user = userEvent.setup();
        render();

        await user.click(screen.getByRole('radio', { name: 'Loft' }));
        expect(screen.getByLabelText(/^Nom complet/)).toHaveFocus();
        await user.click(screen.getByRole('radio', { name: 'E-mail' }));
        expect(screen.getByLabelText(/^Informations complémentaires/)).toHaveFocus();
    });

    it('keeps a draft in the session and restores it', async () => {
        const user = userEvent.setup();
        const { unmount } = render();
        await user.type(screen.getByLabelText(/^Où se situe votre bien/), '10 rue de Rennes');
        await user.type(screen.getByLabelText(/^Nom complet/), 'Jean Dupont');
        await user.click(screen.getByRole('checkbox', { name: /J'accepte/ }));
        expect(JSON.parse(window.sessionStorage.getItem('estimate-draft')!)).toMatchObject({ address: '10 rue de Rennes' });
        expect(JSON.parse(window.sessionStorage.getItem('estimate-draft')!)).not.toHaveProperty('consent');
        expect(JSON.parse(window.sessionStorage.getItem('estimate-draft')!)).not.toHaveProperty('full_name'); // no personal identifier kept
        unmount();

        render();
        expect(screen.getByLabelText(/^Où se situe votre bien/)).toHaveValue('10 rue de Rennes');
        expect(screen.getByLabelText(/^Nom complet/)).toHaveValue('');
        expect(screen.getByRole('checkbox', { name: /J'accepte/ })).not.toBeChecked(); // consent is never restored
    });

    it('does not post an incomplete form: flags and focuses the first missing field, in page order', async () => {
        const user = userEvent.setup();
        render();

        await user.click(screen.getAllByRole('button', { name: 'Demander mon estimation' })[0]);
        expect(formPost).not.toHaveBeenCalled();
        expect(screen.getByLabelText(/^Nom complet/)).toHaveFocus();
        expect(screen.getByLabelText(/^Nom complet/)).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByRole('alert')).toHaveTextContent('Ce champ est nécessaire pour envoyer votre demande.');

        await user.type(screen.getByLabelText(/^Nom complet/), 'Jean'); // editing clears the flag…
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        await user.click(screen.getAllByRole('button', { name: 'Demander mon estimation' })[1]); // …and the mobile bar button follows the same path
        expect(screen.getByLabelText(/^Adresse e-mail/)).toHaveFocus();
    });

    it('opens the recap in a bottom sheet from the mobile bar', async () => {
        const user = userEvent.setup();
        render();

        const arrow = screen.getByRole('button', { name: 'Voir le récapitulatif' });
        expect(arrow.querySelector('svg')).not.toHaveClass('rotate-x-180');
        await user.click(arrow);
        expect(arrow.querySelector('svg')).toHaveClass('rotate-x-180'); // the chevron flips over while the recap is up
        const sheet = screen.getByRole('dialog', { name: 'Votre demande' });
        expect(within(sheet).getByRole('complementary', { name: 'Votre demande' })).toBeInTheDocument();
        expect(sheet.querySelector('.shadow-lg')).toBeNull(); // no card inside the sheet
        await user.click(screen.getByRole('button', { name: 'Voir le récapitulatif' })); // the arrow stays reachable and closes it
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('brings the mobile bar back to the screen bottom when the recap opens past the end of the form', async () => {
        const user = userEvent.setup();
        const scrollBy = vi.mocked(window.scrollBy).mockClear();
        render();

        // jsdom lays the bar out at the top of the viewport (rect.bottom = 0): it sits a whole screen above its stuck position
        await user.click(screen.getByRole('button', { name: 'Voir le récapitulatif' }));
        expect(scrollBy).toHaveBeenCalledWith({ top: -window.innerHeight, behavior: 'smooth' });
        scrollBy.mockClear();
        await user.click(screen.getByRole('button', { name: 'Voir le récapitulatif' }));
        expect(scrollBy).not.toHaveBeenCalled(); // closing never moves the page
    });

    it('shows the confirmation (reference, advisor, next steps) instead of the form once sent', async () => {
        const user = userEvent.setup();
        page.props = sharedProps({
            flash: {
                success: null,
                callbackPhone: null,
                newsletter: null,
                estimate: 'Votre demande est bien reçue.',
                valuationReference: 'VAL-2026-0184',
            },
        });
        render();

        expect(screen.queryAllByRole('button', { name: 'Demander mon estimation' })).toHaveLength(0);
        const status = screen.getAllByRole('status')[0];
        expect(status).toHaveTextContent('Votre demande est bien reçue.');
        expect(screen.getByRole('heading', { level: 2, name: 'Votre demande a bien été reçue' })).toHaveFocus();
        expect(screen.getByText('VAL-2026-0184')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 3, name: 'Votre conseiller' })).toBeInTheDocument();
        expect(screen.getByText("12+ ans d'expérience")).toBeInTheDocument();
        expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(
            expect.arrayContaining(['CompletAnalyse par un expert', '2Échange personnalisé', '3Conseils de valorisation']),
        );
        expect(screen.getByRole('link', { name: 'Découvrir nos biens' })).toHaveAttribute('href', '/acheter-immobilier-paris');

        await user.click(screen.getByRole('button', { name: 'Copier la référence' }));
        expect(await navigator.clipboard.readText()).toBe('VAL-2026-0184');
        expect(screen.getByRole('button', { name: 'Référence copiée' })).toBeInTheDocument();
    });

    it('has no axe violations', async () => {
        const { container } = render();
        expect(await axe(container)).toHaveNoViolations();
    });
});
