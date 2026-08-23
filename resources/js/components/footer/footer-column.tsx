import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

type FooterColumnProps = { title: string; badge?: ReactNode; children: ReactNode; className?: string };

/** Titled footer column: Montserrat semibold 16 heading, 12px gap to the content. */
export default function FooterColumn({ title, badge, children, className }: FooterColumnProps) {
    return (
        <div className={cn('flex flex-col gap-4', className)}>
            <div className="flex items-center gap-3">
                <h2 className="font-heading text-foreground text-base font-semibold">{title}</h2>
                {badge}
            </div>
            {children}
        </div>
    );
}
