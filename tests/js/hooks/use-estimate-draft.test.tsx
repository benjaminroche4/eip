import { type EstimateFormData } from '@/components/estimate/types';
import { useEstimateDraft } from '@/hooks/use-estimate-draft';
import { act, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

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

let api: { setData: (patch: Partial<EstimateFormData>) => void; clearDraft: () => void };

function Probe() {
    const [data, setState] = useState(INITIAL);
    const setData = ((key: keyof EstimateFormData | ((d: EstimateFormData) => EstimateFormData), value?: unknown) =>
        setState((d) => (typeof key === 'function' ? key(d) : { ...d, [key]: value }))) as never;
    const { clearDraft } = useEstimateDraft(data, setData);
    api = { setData: (patch) => setState((d) => ({ ...d, ...patch })), clearDraft };
    return (
        <p>
            {data.full_name}|{String(data.consent)}
        </p>
    );
}

describe('useEstimateDraft', () => {
    beforeEach(() => window.sessionStorage.clear());

    it('saves every change to the session, without the consent nor the honeypot', () => {
        render(<Probe />);
        act(() => api.setData({ full_name: 'Jean Dupont', consent: true, website: 'spam' }));
        const draft = JSON.parse(window.sessionStorage.getItem('estimate-draft')!);
        expect(draft).toMatchObject({ full_name: 'Jean Dupont', property_type: 'apartment' });
        expect(draft).not.toHaveProperty('consent');
        expect(draft).not.toHaveProperty('website');
    });

    it('restores the draft on mount, never the consent', () => {
        window.sessionStorage.setItem('estimate-draft', JSON.stringify({ full_name: 'Jean Dupont', consent: true, website: 'spam' }));
        render(<Probe />);
        expect(screen.getByText('Jean Dupont|false')).toBeInTheDocument();
    });

    it('clears the draft after a successful submit', () => {
        render(<Probe />);
        act(() => api.setData({ full_name: 'Jean Dupont' }));
        expect(window.sessionStorage.getItem('estimate-draft')).not.toBeNull();
        act(() => api.clearDraft());
        expect(window.sessionStorage.getItem('estimate-draft')).toBeNull();
    });
});
