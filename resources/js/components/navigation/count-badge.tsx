import { cn } from '@/lib/utils';

type CountBadgeProps = { count: number; className?: string };

/**
 * Round sand counter next to a navigation label (« Nos biens » in the header, the mobile menu and the footer — user
 * decision 2026-09-25): fully round, sand background, small tabular digits. Decorative: the link carrying it names
 * the count in its `aria-label` (« Nos biens, 6 biens »), so assistive tech never reads a bare digit.
 */
export default function CountBadge({ count, className }: CountBadgeProps) {
    return (
        <span
            aria-hidden
            className={cn(
                'bg-secondary-30 text-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.6875rem] font-medium tabular-nums',
                className,
            )}
        >
            {count}
        </span>
    );
}
