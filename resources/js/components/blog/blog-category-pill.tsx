import { cn } from '@/lib/utils';
import { type CSSProperties } from 'react';
import { type BlogPostSummary } from './types';

type BlogCategoryPillProps = { category: NonNullable<BlogPostSummary['category']>; className?: string };

/** Glass pill with a dot in the category's Sanity colour (falls back to the primary colour). */
export default function BlogCategoryPill({ category, className }: BlogCategoryPillProps) {
    return (
        <span
            className={cn(
                'bg-background/60 text-text-heading flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-2 text-xs font-medium ring-1 ring-white/50 backdrop-blur-md ring-inset',
                className,
            )}
        >
            {/* The only dynamic style tolerated: the category colour comes from Sanity, exposed as a CSS variable. */}
            <span
                aria-hidden
                data-testid="category-dot"
                className={cn('size-1.5 shrink-0 rounded-full', category.color ? 'bg-(--category-color)' : 'bg-primary')}
                style={category.color ? ({ '--category-color': category.color } as CSSProperties) : undefined}
            />
            {category.name}
        </span>
    );
}
