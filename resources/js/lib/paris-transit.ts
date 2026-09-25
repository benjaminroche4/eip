/**
 * Paris metro and RER lines as they appear in the arrondissement profiles (`ui.districts.items[].metro` / `.rer`):
 * the badge classes per line. Colours are the official RATP / Île-de-France Mobilités line colours, declared as
 * tokens in `tokens.css` (`--color-metro-*`, `--color-rer-*`); the text is dark on the light lines, white elsewhere.
 * Literal class names, so Tailwind can see them.
 */
export const METRO_LINES: Record<string, string> = {
    '1': 'bg-metro-1 text-text-heading',
    '2': 'bg-metro-2 text-white',
    '3': 'bg-metro-3 text-white',
    '3bis': 'bg-metro-3bis text-text-heading',
    '4': 'bg-metro-4 text-white',
    '5': 'bg-metro-5 text-text-heading',
    '6': 'bg-metro-6 text-text-heading',
    '7': 'bg-metro-7 text-text-heading',
    '7bis': 'bg-metro-7bis text-text-heading',
    '8': 'bg-metro-8 text-text-heading',
    '9': 'bg-metro-9 text-text-heading',
    '10': 'bg-metro-10 text-text-heading',
    '11': 'bg-metro-11 text-white',
    '12': 'bg-metro-12 text-white',
    '13': 'bg-metro-13 text-text-heading',
    '14': 'bg-metro-14 text-white',
};

export const RER_LINES: Record<string, string> = {
    A: 'bg-rer-a text-white',
    B: 'bg-rer-b text-white',
    C: 'bg-rer-c text-text-heading',
    D: 'bg-rer-d text-white',
    E: 'bg-rer-e text-white',
};
