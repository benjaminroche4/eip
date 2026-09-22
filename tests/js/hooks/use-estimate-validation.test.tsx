import { type EstimateFormData } from '@/components/estimate/types';
import { useEstimateValidation } from '@/hooks/use-estimate-validation';
import { act, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { page, sharedProps } from '../inertia';

const INITIAL: EstimateFormData = {
    property_type: 'apartment',
    full_name: '',
    email: '',
    phone: '',
    address: '',
    surface: '',
    floor: '',
    elevator: false,
    rooms: 1,
    bedrooms: 1,
    features: [],
    condition: '',
    estimated_value: '',
    contact_method: 'phone',
    message: '',
    consent: false,
    website: '',
};

let api: { setData: (patch: Partial<EstimateFormData>) => void; flagMissing: () => boolean };

function Probe({ serverErrors = {} }: { serverErrors?: Partial<Record<keyof EstimateFormData, string>> }) {
    const [data, setState] = useState(INITIAL);
    const { valid, complete, errors, errorFields, flagMissing } = useEstimateValidation(data, serverErrors);
    api = { setData: (patch) => setState((d) => ({ ...d, ...patch })), flagMissing };
    return (
        <>
            <input id="full_name" aria-label="name" readOnly value={data.full_name} />
            <input id="email" aria-label="email" readOnly value={data.email} />
            <p data-testid="valid">{JSON.stringify(valid)}</p>
            <p data-testid="complete">{JSON.stringify(complete)}</p>
            <p data-testid="errors">{JSON.stringify(errors)}</p>
            <p data-testid="fields">{errorFields.join(',')}</p>
        </>
    );
}

describe('useEstimateValidation', () => {
    beforeEach(() => {
        page.props = sharedProps();
    });

    it('checks e-mail / phone / address and completes the steps as the owner types', () => {
        render(<Probe />);
        expect(JSON.parse(screen.getByTestId('valid').textContent!)).toEqual({ email: false, phone: false, address: false });
        expect(JSON.parse(screen.getByTestId('complete').textContent!)).toEqual({
            type: true,
            contact: false,
            details: false,
            method: true,
            more: false,
        });

        act(() =>
            api.setData({ full_name: 'Jean', email: 'jean@example.com', phone: '+33612345678', address: '3 rue Grégoire de Tours', surface: '60' }),
        );
        expect(JSON.parse(screen.getByTestId('valid').textContent!)).toEqual({ email: true, phone: true, address: true });
        expect(JSON.parse(screen.getByTestId('complete').textContent!)).toMatchObject({ contact: true, details: true });
    });

    it('flags and focuses the first missing field in page order, then clears the flag on the next edit', () => {
        render(<Probe />);
        let blocked = false;
        act(() => {
            blocked = api.flagMissing();
        });
        expect(blocked).toBe(true);
        expect(screen.getByLabelText('name')).toHaveFocus();
        expect(JSON.parse(screen.getByTestId('errors').textContent!)).toEqual({ full_name: 'Ce champ est nécessaire pour envoyer votre demande.' });
        expect(screen.getByTestId('fields')).toHaveTextContent('full_name');

        act(() => api.setData({ full_name: 'Jean' }));
        expect(JSON.parse(screen.getByTestId('errors').textContent!)).toEqual({});
        act(() => {
            blocked = api.flagMissing();
        });
        expect(screen.getByLabelText('email')).toHaveFocus();
    });

    it('lets a complete form through', () => {
        render(<Probe />);
        act(() =>
            api.setData({
                full_name: 'Jean',
                email: 'jean@example.com',
                phone: '+33612345678',
                address: '3 rue Grégoire de Tours',
                surface: '60',
                consent: true,
            }),
        );
        let blocked = true;
        act(() => {
            blocked = api.flagMissing();
        });
        expect(blocked).toBe(false);
        expect(screen.getByTestId('fields')).toHaveTextContent('');
    });

    it('lists the server errors in page order and focuses the first one on arrival', () => {
        render(<Probe serverErrors={{ email: 'E-mail invalide', full_name: 'Nom requis' }} />);
        expect(screen.getByTestId('fields')).toHaveTextContent('full_name,email');
        expect(screen.getByLabelText('name')).toHaveFocus();
    });
});
