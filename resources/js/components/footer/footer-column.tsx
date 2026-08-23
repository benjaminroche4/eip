import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

type FooterColumnProps = { title: string; children: ReactNode; className?: string };

/** Titled footer column: Montserrat semibold 16 heading, 12px gap to the content. */
export default function FooterColumn({ title, children, className }: FooterColumnProps) {
    return (
        <div className={cn('flex flex-col gap-4', className)}>
            <h2 className="font-heading text-foreground text-base font-semibold">{title}</h2>
            {children}
        </div>
    );
}
