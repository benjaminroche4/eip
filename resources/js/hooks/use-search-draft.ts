import { useEffect, useState } from 'react';

export const SEARCH_DRAFT_KEY = 'home-search';
export type SearchDraft = { cities: number[]; budget: string };

const isDraft = (value: unknown): value is SearchDraft =>
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as SearchDraft).cities) &&
    (value as SearchDraft).cities.every((n) => Number.isInteger(n) && n >= 1 && n <= 20) &&
    typeof (value as SearchDraft).budget === 'string';

/**
 * Draft of the home search (arrondissements + budget): a visitor coming back from another page finds their criteria
 * again (`sessionStorage` `home-search`, session only — the same pattern as the valuation form's draft). Restored
 * once on mount, then saved on every change; nothing is written before the restore has run, so an empty first render
 * never wipes a saved draft. Storage failures (private mode, quota) are ignored.
 */
export function useSearchDraft(draft: SearchDraft, restore: (draft: SearchDraft) => void): void {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        try {
            const raw = window.sessionStorage.getItem(SEARCH_DRAFT_KEY);
            const saved: unknown = raw ? JSON.parse(raw) : null;
            if (isDraft(saved)) restore(saved);
        } catch {
            /* storage unavailable or corrupt: no draft */
        }
        setReady(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!ready) return;
        try {
            window.sessionStorage.setItem(SEARCH_DRAFT_KEY, JSON.stringify(draft));
        } catch {
            /* ignore */
        }
    }, [ready, draft]);
}
