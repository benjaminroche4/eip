import { PARIS_ARRONDISSEMENTS } from '@/lib/paris-arrondissements';
import { cn } from '@/lib/utils';

type ArrondissementGlyphProps = {
    /** Arrondissement number 1-20, or a name it can be read from (« Paris 6e », « Paris 16th »). */
    arrondissement: number | string;
    className?: string;
};

/** Bounding box of a generated path (`M x y L x y … Z`), padded so the hairline stroke never touches the edge. */
const viewBox = (d: string): string => {
    const numbers = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    const xs = numbers.filter((_, i) => i % 2 === 0);
    const ys = numbers.filter((_, i) => i % 2 === 1);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const pad = Math.max(maxX - minX, maxY - minY) * 0.06;
    return `${minX - pad} ${minY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`;
};

/**
 * Outline of one arrondissement (its real shape from `lib/paris-arrondissements.ts`), decorative: a dark-sand hairline
 * only, no fill (user decision 2026-09-25), scaled to its own bounding box so every arrondissement fills the same
 * square. Inlaid large in the bottom-right corner of the district cards, overflowing the card and clipped by it.
 * Renders nothing for an unknown number.
 */
export default function ArrondissementGlyph({ arrondissement, className }: ArrondissementGlyphProps) {
    const n = typeof arrondissement === 'number' ? arrondissement : Number(/\d+/.exec(arrondissement)?.[0]);
    const shape = PARIS_ARRONDISSEMENTS.find((s) => s.n === n);
    if (!shape) return null;

    return (
        <svg aria-hidden viewBox={viewBox(shape.d)} className={cn('pointer-events-none', className)} data-arrondissement={n}>
            <path d={shape.d} className="stroke-secondary-60 fill-none" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}
