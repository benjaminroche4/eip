import { type EstimateErrors, type EstimateFormData, type EstimateValidity, FIELD_ORDER } from '@/components/estimate/types';
import { useTranslation } from '@/hooks/use-translation';
import { focusField } from '@/lib/focus-field';
import { useEffect, useState } from 'react';
import { isValidPhoneNumber } from 'react-phone-number-input';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type EstimateCompletion = { type: boolean; contact: boolean; details: boolean; method: boolean; more: boolean };

type EstimateValidation = {
    /** Positive feedback: a quiet check once a field is valid, without waiting for the server. */
    valid: EstimateValidity;
    /** One flag per step, drives the step headings and the recap gauge. */
    complete: EstimateCompletion;
    /** Server errors merged with the local "required" flags. */
    errors: EstimateErrors;
    /** Fields in error, in page order (error summary + focus on arrival). */
    errorFields: string[];
    /** Flags and focuses the first missing required field (page order); returns true when the form must not be sent. */
    flagMissing: () => boolean;
};

/**
 * Client-side validity of the valuation request. Submitting an incomplete form never leaves the page: the first
 * missing field (in page order) is flagged with `estimate.required_hint` and focused; any edit clears the flag.
 * After a failed submit the server errors come back with the redirect: the visitor is brought to the first one.
 */
export function useEstimateValidation(data: EstimateFormData, serverErrors: Partial<Record<keyof EstimateFormData, string>>): EstimateValidation {
    const { t } = useTranslation();

    const valid: EstimateValidity = {
        email: EMAIL.test(data.email.trim()),
        phone: data.phone !== '' && isValidPhoneNumber(data.phone),
        address: data.address.trim().length >= 5,
    };
    const complete: EstimateCompletion = {
        type: data.property_type !== '',
        contact: data.full_name.trim() !== '' && valid.email && valid.phone,
        details: valid.address && data.surface !== '',
        method: data.contact_method !== '',
        more: data.consent,
    };

    const [localErrors, setLocalErrors] = useState<EstimateErrors>({});
    useEffect(() => setLocalErrors({}), [data]); // any edit clears the local flags
    const errors: EstimateErrors = { ...serverErrors, ...localErrors };

    const missing = (): string | null => {
        const checks: Record<string, boolean> = {
            property_type: data.property_type !== '',
            full_name: data.full_name.trim() !== '',
            email: valid.email,
            phone: valid.phone,
            address: valid.address,
            surface: data.surface !== '',
            contact_method: data.contact_method !== '',
            consent: data.consent,
        };
        return FIELD_ORDER.find((f) => f in checks && !checks[f]) ?? null;
    };

    const errorFields = FIELD_ORDER.filter((f) => errors[f]);

    useEffect(() => {
        if (errorFields.length > 0) focusField(errorFields[0]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [errorFields.join(',')]);

    const flagMissing = () => {
        const field = missing();
        if (!field) return false;
        setLocalErrors({ [field]: t('estimate.required_hint') });
        focusField(field);
        return true;
    };

    return { valid, complete, errors, errorFields, flagMissing };
}
