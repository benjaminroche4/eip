import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/use-translation';
import { loadPlaces } from '@/lib/google-places';
import { cn } from '@/lib/utils';
import { Check, MapPin } from 'lucide-react';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';

type FieldAria = { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string; 'aria-required': boolean };

type Suggestion = { id: string; main: string; secondary: string; full: string };

type AddressAutocompleteProps = {
    aria: FieldAria;
    value: string;
    onChange: (value: string) => void;
    /** Shows the green "valid" check, like the e-mail and phone fields. */
    valid: boolean;
    /** Google Maps browser key — null renders a plain input, no suggestions. */
    apiKey: string | null;
    locale: string;
    placeholder: string;
};

const MIN_CHARS = 3;
const DEBOUNCE_MS = 300;

/** Bounding box over Paris intra-muros (boulevard périphérique): suggestions never leave the agency's area. */
const PARIS_AREA = { west: 2.224, south: 48.815, east: 2.47, north: 48.902 };

/**
 * Address field with Google Places suggestions (new Places API, Paris intra-muros only), rendered as an accessible
 * combobox with the site's own dropdown: sharp corners, sand hover, hairline border — never the Google widget.
 * The Maps script loads on the field's first focus, one billing session per address picked.
 */
export default function AddressAutocomplete({ aria, value, onChange, valid, apiKey, locale, placeholder }: AddressAutocompleteProps) {
    const { t } = useTranslation();
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const tokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestRef = useRef(0);
    const listboxId = `${aria.id}-suggestions`;

    useEffect(() => () => clearTimeout(debounceRef.current ?? undefined), []);

    const close = () => {
        setOpen(false);
        setActive(-1);
    };

    const fetchSuggestions = async (input: string) => {
        const places = apiKey ? await loadPlaces(apiKey, locale) : null;
        if (!places) return;

        tokenRef.current ??= new places.AutocompleteSessionToken();
        const request = requestRef.current + 1;
        requestRef.current = request;
        try {
            const { suggestions: found } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
                input,
                sessionToken: tokenRef.current,
                includedRegionCodes: ['fr'],
                locationRestriction: PARIS_AREA,
                language: locale,
            });
            if (request !== requestRef.current) return; // a newer keystroke superseded this one

            const list = found.flatMap(({ placePrediction: p }): Suggestion[] =>
                p ? [{ id: p.placeId, main: p.mainText?.text ?? p.text.text, secondary: p.secondaryText?.text ?? '', full: p.text.text }] : [],
            );
            setSuggestions(list);
            setActive(-1);
            setOpen(list.length > 0);
        } catch {
            close(); // quota or network error: the field keeps working as a plain input
        }
    };

    const handleChange = (next: string) => {
        onChange(next);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!apiKey || next.trim().length < MIN_CHARS) {
            close();

            return;
        }
        debounceRef.current = setTimeout(() => void fetchSuggestions(next.trim()), DEBOUNCE_MS);
    };

    const select = (suggestion: Suggestion) => {
        onChange(suggestion.full);
        tokenRef.current = null; // picking a place ends the billing session
        close();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (!open) return;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((current) => (current + 1) % suggestions.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
        } else if (event.key === 'Enter' && active >= 0) {
            event.preventDefault();
            select(suggestions[active]);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            close();
        } else if (event.key === 'Tab') {
            close();
        }
    };

    /** Bolds the typed query inside a suggestion so the eye lands on the match. */
    const highlight = (text: string) => {
        const query = value.trim();
        const at = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
        if (at < 0) return text;

        return (
            <>
                {text.slice(0, at)}
                <span className="font-semibold">{text.slice(at, at + query.length)}</span>
                {text.slice(at + query.length)}
            </>
        );
    };

    return (
        <div className="relative">
            <Input
                {...aria}
                role="combobox"
                name="address"
                autoComplete="off"
                aria-expanded={open}
                aria-autocomplete="list"
                aria-controls={open ? listboxId : undefined}
                aria-activedescendant={active >= 0 ? `${listboxId}-${active}` : undefined}
                placeholder={placeholder}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => apiKey && void loadPlaces(apiKey, locale)}
                onBlur={close}
                className={cn(valid && 'pr-9')}
            />
            {valid && (
                <span className="text-success pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                    <Check aria-hidden className="animate-pop size-4 motion-reduce:animate-none" />
                    <span className="sr-only">{t('estimate.valid')}</span>
                </span>
            )}
            {open && (
                <div className="border-border bg-card absolute top-full right-0 left-0 z-10 mt-1 rounded-none border">
                    <ul role="listbox" id={listboxId} aria-label={t('estimate.address_suggestions')} className="max-h-72 overflow-y-auto py-1">
                        {suggestions.map((suggestion, index) => (
                            <li
                                key={suggestion.id}
                                id={`${listboxId}-${index}`}
                                role="option"
                                aria-selected={index === active}
                                onPointerDown={(e) => e.preventDefault() /* keep the input focused so blur does not eat the click */}
                                onClick={() => select(suggestion)}
                                onMouseMove={() => setActive(index)}
                                className={cn('flex cursor-pointer items-center gap-3 px-3 py-2', index === active && 'bg-background-05')}
                            >
                                <span
                                    className={cn(
                                        'flex size-8 shrink-0 items-center justify-center',
                                        index === active ? 'bg-background-08' : 'bg-background-05',
                                    )}
                                >
                                    <MapPin aria-hidden className="text-muted-foreground size-4" />
                                </span>
                                <span className="flex min-w-0 flex-col">
                                    <span className="text-foreground truncate text-sm">{highlight(suggestion.main)}</span>
                                    {suggestion.secondary && <span className="text-muted-foreground truncate text-xs">{suggestion.secondary}</span>}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-muted-foreground border-border border-t px-3 py-1.5 text-right text-xs">{t('estimate.address_attribution')}</p>
                </div>
            )}
        </div>
    );
}
