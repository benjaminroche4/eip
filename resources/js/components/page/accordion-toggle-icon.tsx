import { cn } from '@/lib/utils';

type AccordionToggleIconProps = { className?: string };

/** Same recipe as the hamburger (menu-toggle-icon): hairlines animated with transforms only (300 ms, no spin). */
const lineClass =
    'absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none';

/**
 * Plus morphing into a minus (14×14): the vertical hairline collapses from its centre (scale-y → 0) when the
 * accordion item opens, leaving the horizontal one — no rotation. Driven by the Radix `data-state` of the
 * trigger (`group`), no React state needed.
 */
export default function AccordionToggleIcon({ className }: AccordionToggleIconProps) {
    return (
        <span aria-hidden className={cn('relative block size-3.5', className)}>
            <span className={lineClass} />
            <span className={cn(lineClass, 'origin-center rotate-90 group-data-[state=open]:scale-x-0')} />
        </span>
    );
}
