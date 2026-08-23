import { cn } from '@/lib/utils';

/** Vertical 28px separator (Base/Stroke), desktop only. */
export default function NavDivider({ className }: { className?: string }) {
    return <span aria-hidden className={cn('bg-border hidden h-7 w-px shrink-0 lg:block', className)} />;
}
