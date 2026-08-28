import { cn } from '@/lib/utils';

type PageEyebrowProps = { children: string; className?: string };

/** Small uppercase label above a page <h1> (contact, newsletter): decorative context, not a heading. */
export default function PageEyebrow({ children, className }: PageEyebrowProps) {
    return <p className={cn('text-muted-foreground font-heading text-xs font-medium tracking-wider uppercase', className)}>{children}</p>;
}
