import { AccordionContent } from '@/components/ui/accordion';
import { useEffect, useState, type ReactNode } from 'react';

type FaqAnswerPanelProps = { open: boolean; children: ReactNode };

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * An FAQ answer that stays in the HTML when closed (SEO / GEO review 2026-10-11): Radix unmounts a closed
 * `AccordionContent`, so only the JSON-LD carried the 40 answers. `forceMount` keeps the markup; `hidden` is applied
 * once the close animation has ended (at once under reduced motion, and in the SSR HTML), so closed answers are
 * neither visible, nor read by assistive tech, nor tabbable, while the open / close slides are preserved.
 */
export default function FaqAnswerPanel({ open, children }: FaqAnswerPanelProps) {
    const [settled, setSettled] = useState(!open);

    useEffect(() => {
        if (open) setSettled(false);
        else if (reducedMotion()) setSettled(true);
    }, [open]);

    return (
        <AccordionContent forceMount hidden={!open && settled} onAnimationEnd={() => !open && setSettled(true)}>
            {children}
        </AccordionContent>
    );
}
