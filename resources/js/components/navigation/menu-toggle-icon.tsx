import { cn } from '@/lib/utils';

type MenuToggleIconProps = { open: boolean; className?: string };

/** All three lines sit at the vertical centre and are only ever moved with transforms, so every step animates. */
const lineClass =
    'absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none';

/**
 * Three hairlines (20×14) morphing into a cross: the outer lines slide to the centre while rotating
 * ±45°, the middle one collapses from its centre (scale-x → 0). Reverses on close.
 */
export default function MenuToggleIcon({ open, className }: MenuToggleIconProps) {
    return (
        <span aria-hidden className={cn('relative block h-3.5 w-5', className)}>
            <span className={cn(lineClass, open ? 'rotate-45' : '-translate-y-[calc(50%+6px)]')} />
            <span className={cn(lineClass, 'origin-center', open ? 'scale-x-0 opacity-0 transition-[transform,opacity]' : '')} />
            <span className={cn(lineClass, open ? '-rotate-45' : 'translate-y-[calc(-50%+6px)]')} />
        </span>
    );
}
