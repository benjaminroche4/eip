import { cn } from '@/lib/utils';
import { type ComponentProps } from 'react';

type BlogSideCardProps = ComponentProps<'div'>;

/** Side card of the article page, same frame as the valuation recap: sand hairline, soft shadow, sand gradient inside. */
export default function BlogSideCard({ className, children, ...props }: BlogSideCardProps) {
    return (
        <div className={cn('border-secondary-30 bg-card border p-2', className)} {...props}>
            <div className="from-background-05 flex flex-col gap-4 bg-linear-to-b to-transparent px-5 pt-6 pb-5">{children}</div>
        </div>
    );
}
