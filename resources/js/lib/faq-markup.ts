/**
 * Minimal markup for FAQ answers written in lang/ui.php: `[label](route.name)` becomes an internal link.
 * Kept deliberately tiny (no HTML in translations): a link to a named route is the only construct.
 */
const LINK = /\[([^\]]+)\]\(([a-z][a-z0-9_.]*)\)/g;

export type FaqSegment = { type: 'text'; value: string } | { type: 'link'; value: string; route: string };

export function parseFaqMarkup(text: string): FaqSegment[] {
    const segments: FaqSegment[] = [];
    let last = 0;
    for (const match of text.matchAll(LINK)) {
        const index = match.index ?? 0;
        if (index > last) segments.push({ type: 'text', value: text.slice(last, index) });
        segments.push({ type: 'link', value: match[1], route: match[2] });
        last = index + match[0].length;
    }
    if (last < text.length) segments.push({ type: 'text', value: text.slice(last) });
    return segments;
}

/** Plain text (for JSON-LD, search): links keep their label only. */
export function stripFaqMarkup(text: string): string {
    return text.replace(LINK, '$1');
}
