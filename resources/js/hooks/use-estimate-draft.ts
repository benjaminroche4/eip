import { DRAFT_KEY, type EstimateFormData, type EstimateSetData } from '@/components/estimate/types';
import { useEffect } from 'react';

/**
 * Draft of the valuation request: what was typed survives a reload / a detour to another page (`sessionStorage`
 * `estimate-draft`, session only). Restored once on mount — never the consent nor the honeypot —, saved on every
 * change, cleared by `clearDraft()` after a successful submit. Storage failures (private mode, quota) are ignored.
 */
export function useEstimateDraft(data: EstimateFormData, setData: EstimateSetData): { clearDraft: () => void } {
    useEffect(() => {
        try {
            const draft = window.sessionStorage.getItem(DRAFT_KEY);
            if (draft) setData((current) => ({ ...current, ...JSON.parse(draft), consent: false, website: '' }));
        } catch {
            /* storage unavailable (private mode, quota): no draft */
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        try {
            // Never the consent nor the honeypot, and no personal identifier either (shared computer: a later visitor must not
            // see a name, e-mail or phone come back — user decision 2026-09-22); the property fields are enough to resume.
            const { consent, website, full_name, email, phone, ...draft } = data;
            void consent;
            void website;
            void full_name;
            void email;
            void phone;
            window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        } catch {
            /* ignore */
        }
    }, [data]);

    const clearDraft = () => {
        try {
            window.sessionStorage.removeItem(DRAFT_KEY);
        } catch {
            /* ignore */
        }
    };

    return { clearDraft };
}
