import { useEffect, useState } from 'react';

/** Below `sm`: the search bar's lists open in a bottom sheet instead of a popover (the keyboard would cover a popover). */
export const SMALL_SCREEN = '(max-width: 639px)';
/** From `lg`: the properties page splits list / map, the filters open in a centred dialog. */
export const LARGE_SCREEN = '(min-width: 1024px)';

/** True while the media query matches (false on the server and before the first effect: SSR-safe). */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const mql = window.matchMedia(query);
        const update = () => setMatches(mql.matches);
        update();
        mql.addEventListener('change', update);
        return () => mql.removeEventListener('change', update);
    }, [query]);
    return matches;
}
