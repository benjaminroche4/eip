import { type InertiaFormProps } from '@inertiajs/react';

export const FORM_ID = 'estimate-form';
export const MESSAGE_MAX = 2000;
export const DRAFT_KEY = 'estimate-draft';

/** Field order on the page — the error summary and the "focus the first error" behaviour follow it. */
export const FIELD_ORDER = [
    'property_type',
    'full_name',
    'email',
    'phone',
    'address',
    'surface',
    'floor',
    'rooms',
    'bedrooms',
    'condition',
    'estimated_value',
    'contact_method',
    'message',
    'consent',
];

export type EstimateFormData = {
    property_type: string;
    full_name: string;
    email: string;
    phone: string;
    address: string;
    surface: string;
    floor: string;
    elevator: boolean;
    rooms: number;
    bedrooms: number;
    features: string[];
    condition: string;
    estimated_value: string; // digits only; displayed grouped (1 500 000)
    contact_method: string;
    message: string;
    consent: boolean;
    website: string; // honeypot, stays empty
};

export type EstimateSetData = InertiaFormProps<EstimateFormData>['setData'];

/** Server errors merged with the local "required" flags, keyed by field. */
export type EstimateErrors = Partial<Record<string, string>>;

/** Positive feedback: a quiet check once a field is valid, without waiting for the server. */
export type EstimateValidity = { email: boolean; phone: boolean; address: boolean };

/** What every step receives; each one adds its own options and helpers. */
export type EstimateStepProps = {
    data: EstimateFormData;
    setData: EstimateSetData;
    errors: EstimateErrors;
    complete: boolean;
};
