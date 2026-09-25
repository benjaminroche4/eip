import { SEARCH_DRAFT_KEY, type SearchDraft, useSearchDraft } from '@/hooks/use-search-draft';
import { act, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

function Harness() {
    const [draft, setDraft] = useState<SearchDraft>({ cities: [], budget: '' });
    useSearchDraft(draft, setDraft);
    return (
        <>
            <output data-testid="draft">{JSON.stringify(draft)}</output>
            <button type="button" onClick={() => setDraft({ cities: [6, 16], budget: '1 500 000' })}>
                set
            </button>
        </>
    );
}

describe('useSearchDraft', () => {
    beforeEach(() => window.sessionStorage.clear());

    it('restores a saved draft on mount without wiping it first, then saves every change', async () => {
        window.sessionStorage.setItem(SEARCH_DRAFT_KEY, JSON.stringify({ cities: [7], budget: '900 000' }));
        render(<Harness />);
        expect(screen.getByTestId('draft')).toHaveTextContent('{"cities":[7],"budget":"900 000"}');
        expect(JSON.parse(window.sessionStorage.getItem(SEARCH_DRAFT_KEY)!)).toEqual({ cities: [7], budget: '900 000' }); // untouched by the empty first render
        await act(async () => screen.getByRole('button', { name: 'set' }).click());
        expect(JSON.parse(window.sessionStorage.getItem(SEARCH_DRAFT_KEY)!)).toEqual({ cities: [6, 16], budget: '1 500 000' });
    });

    it('ignores a corrupt or foreign draft', () => {
        window.sessionStorage.setItem(SEARCH_DRAFT_KEY, JSON.stringify({ cities: [42, 'x'], budget: 3 }));
        render(<Harness />);
        expect(screen.getByTestId('draft')).toHaveTextContent('{"cities":[],"budget":""}');
        window.sessionStorage.setItem(SEARCH_DRAFT_KEY, '{not json');
        render(<Harness />);
        expect(screen.getAllByTestId('draft').at(-1)).toHaveTextContent('{"cities":[],"budget":""}');
    });
});
