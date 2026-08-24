import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type PointerEvent, useRef, useState } from 'react';

const VALUES = ['value_1', 'value_2', 'value_3'] as const;

/**
 * Value strip under the hero (Figma 123-311 / 125-420): three short arguments separated by hairlines.
 * Centred on desktop; on mobile one row that scrolls horizontally — by touch natively and by mouse drag.
 */
export default function ValueStrip() {
    const { t } = useTranslation();
    const track = useRef<HTMLUListElement>(null);
    const drag = useRef<{ x: number; left: number } | null>(null);
    const [dragging, setDragging] = useState(false);

    // Mouse drag-to-scroll that still lets users select text: it only kicks in after 6px of
    // horizontal movement, and only when the row actually overflows (never on centred desktop).
    const onPointerDown = (e: PointerEvent<HTMLUListElement>) => {
        const el = track.current;
        if (e.pointerType !== 'mouse' || !el || el.scrollWidth <= el.clientWidth) return;
        drag.current = { x: e.clientX, left: el.scrollLeft };
    };
    const onPointerMove = (e: PointerEvent<HTMLUListElement>) => {
        const el = track.current;
        if (!drag.current || !el) return;
        const delta = e.clientX - drag.current.x;
        if (!dragging) {
            if (Math.abs(delta) < 6) return;
            el.setPointerCapture(e.pointerId);
            setDragging(true);
        }
        el.scrollLeft = drag.current.left - delta;
    };
    const endDrag = (e: PointerEvent<HTMLUListElement>) => {
        const el = track.current;
        if (dragging && el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
        drag.current = null;
        setDragging(false);
    };

    return (
        <section aria-label={t('home.values_label')} className="py-8 lg:py-10">
            <ul
                ref={track}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={cn(
                    'flex items-center gap-10 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6 lg:cursor-auto lg:justify-center lg:gap-15 lg:px-0 [&::-webkit-scrollbar]:hidden',
                    dragging ? 'cursor-grabbing select-none' : 'cursor-grab',
                )}
            >
                {VALUES.map((key, i) => (
                    <li
                        key={key}
                        className="text-muted-foreground flex shrink-0 items-center gap-10 text-sm whitespace-nowrap lg:gap-15 lg:text-base"
                    >
                        {i > 0 && <span aria-hidden className="bg-grey-30/50 h-5 w-px shrink-0" />}
                        {t(`home.${key}`)}
                    </li>
                ))}
            </ul>
        </section>
    );
}
