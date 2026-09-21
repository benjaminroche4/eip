import { cn } from '@/lib/utils';

type GradientHairlineProps = { className?: string; /** Vertical divider (1px wide, fades top/bottom) instead of horizontal. */ vertical?: boolean };

/**
 * 1px divider fading out at both ends (footer, contact details, benefits) — decorative, hidden from assistive tech.
 * Vertical: `self-stretch` alone gives the height in a flex row (an explicit `h-full` resolved to 0 there — bug found
 * 2026-09-16 on the key figures); position it with `absolute top-* bottom-*` outside a flex row.
 */
export default function GradientHairline({ className, vertical = false }: GradientHairlineProps) {
    return (
        <span
            aria-hidden
            className={cn(
                'via-border block from-transparent to-transparent',
                vertical ? 'w-px self-stretch bg-linear-to-b' : 'h-px w-full bg-linear-to-r',
                className,
            )}
        />
    );
}
