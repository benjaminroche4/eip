import { cn } from '@/lib/utils';
import { useId } from 'react';

type RingsBackdropProps = { /** Override the size / position of the rings (default: 44rem centred). */ className?: string };

/**
 * Decorative backdrop (user decision 2026-09-16, ui.sh variant « Cercles concentriques », softened): five concentric
 * hairline circles in a sand gradient (fading to nothing on the outer rings), very low opacity, turning once a minute
 * while breathing slightly. Behind the content, hidden from assistive tech, still under `motion-reduce`. Shared by the
 * CTA card and the « À propos » manifesto band; the gradient id is unique per instance (several can share a page).
 */
export default function RingsBackdrop({ className }: RingsBackdropProps) {
    const id = useId();

    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div
                className={cn(
                    'animate-rings-breathe absolute top-1/2 left-1/2 size-[44rem] -translate-x-1/2 -translate-y-1/2 motion-reduce:animate-none',
                    className,
                )}
            >
                <svg viewBox="0 0 600 600" className="animate-rings size-full motion-reduce:animate-none" fill="none" strokeWidth="1">
                    <defs>
                        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="var(--color-secondary-50)" stopOpacity="0.35" />
                            <stop offset="0.5" stopColor="var(--color-secondary-30)" stopOpacity="0.15" />
                            <stop offset="1" stopColor="var(--color-secondary-50)" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {[80, 140, 200, 260, 300].map((r) => (
                        <circle key={r} cx="300" cy="300" r={r} stroke={`url(#${id})`} />
                    ))}
                </svg>
            </div>
        </div>
    );
}
