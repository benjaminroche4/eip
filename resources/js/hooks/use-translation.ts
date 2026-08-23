import { type SharedData, type Translations } from '@/types';
import { usePage } from '@inertiajs/react';
import { useCallback } from 'react';

type Replacements = Record<string, string | number>;

function lookup(tree: Translations, key: string): string | undefined {
    const value = key.split('.').reduce<Translations | string | undefined>((node, part) => {
        if (node === undefined || typeof node === 'string') return undefined;
        return node[part];
    }, tree);
    return typeof value === 'string' ? value : undefined;
}

/** Laravel-style pluralisation: "{0} none|{1} one|[2,*] many" or "one|many". */
function choose(message: string, count: number): string {
    const parts = message.split('|');
    const explicit = parts.find((p) => {
        const m = p.match(/^\s*(\{(\d+)\}|\[(\d+|\*),(\d+|\*)\])/);
        if (!m) return false;
        if (m[2] !== undefined) return Number(m[2]) === count;
        const min = m[3] === '*' ? -Infinity : Number(m[3]);
        const max = m[4] === '*' ? Infinity : Number(m[4]);
        return count >= min && count <= max;
    });
    if (explicit) return explicit.replace(/^\s*(\{\d+\}|\[[^\]]+\])\s*/, '');
    const plain = parts.filter((p) => !/^\s*(\{\d+\}|\[[^\]]+\])/.test(p));
    if (plain.length === 0) return message;
    return plain.length === 1 ? plain[0] : count === 1 ? plain[0] : plain[1];
}

function replace(message: string, replacements: Replacements): string {
    return Object.entries(replacements).reduce((acc, [k, v]) => acc.replaceAll(`:${k}`, String(v)), message);
}

/**
 * Translate UI strings from lang/{locale}/ui.php (shared as the `translations` prop).
 *   t('nav.search')                          → "Recherche"
 *   t('search.title_with_term', { term })    → "Recherche : foo"
 *   tc('search.results', 3, { count: 3 })    → "3 résultats"
 */
export function useTranslation() {
    const { translations, locale } = usePage<SharedData>().props;

    const t = useCallback(
        (key: string, replacements: Replacements = {}): string => replace(lookup(translations, key) ?? key, replacements),
        [translations],
    );

    const tc = useCallback(
        (key: string, count: number, replacements: Replacements = {}): string =>
            replace(choose(lookup(translations, key) ?? key, count), { count, ...replacements }),
        [translations],
    );

    return { t, tc, locale };
}
