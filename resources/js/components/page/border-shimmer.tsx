import { cn } from '@/lib/utils';

type BorderShimmerProps = { className?: string };

/**
 * Light gliding along a card's 1px outline (newsletter card, « Dernier article » frame): two conic layers turn
 * together — a wide soft sand glow and a narrow brighter core just ahead of it — twice on load, then rest
 * (`animate-border-shimmer`, reworked 2026-09-22 on user request: the previous grey arc was barely visible).
 * The parent needs `relative`; `ring-mask` keeps only the outline, `motion-reduce` hides it all.
 */
export default function BorderShimmer({ className }: BorderShimmerProps) {
    return (
        <span aria-hidden className={cn('ring-mask pointer-events-none absolute -inset-px overflow-hidden motion-reduce:hidden', className)}>
            <span className="animate-border-shimmer via-secondary-60 absolute -inset-full bg-conic from-transparent from-35% to-transparent to-65%" />
            <span className="animate-border-shimmer via-foreground/40 absolute -inset-full bg-conic from-transparent from-47% to-transparent to-53%" />
        </span>
    );
}
