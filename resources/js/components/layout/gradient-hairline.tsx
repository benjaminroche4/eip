import { cn } from '@/lib/utils';

type GradientHairlineProps = { className?: string; /** Vertical divider (1px wide, fades top/bottom) instead of horizontal. */ vertical?: boolean };

/** 1px divider fading out at both ends (footer, contact details, benefits) — decorative, hidden from assistive tech. */
export default function GradientHairline({ className, vertical = false }: GradientHairlineProps) {
    return (
        <span
            aria-hidden
            className={cn(
                'via-border block from-transparent to-transparent',
                vertical ? 'h-full w-px self-stretch bg-gradient-to-b' : 'h-px w-full bg-gradient-to-r',
                className,
            )}
        />
    );
}
