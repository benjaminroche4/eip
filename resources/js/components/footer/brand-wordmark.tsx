import { cn } from '@/lib/utils';

type BrandWordmarkProps = { className?: string };

/** Outlined wordmark (public/brand/wordmark-outline.svg, Secondary/80) fading out towards the bottom, full width on every breakpoint. Decorative. */
export default function BrandWordmark({ className }: BrandWordmarkProps) {
    return (
        <div className={cn('overflow-hidden', className)}>
            <img
                src="/brand/wordmark-outline.svg"
                alt=""
                aria-hidden
                width={1276}
                height={118}
                loading="lazy"
                decoding="async"
                className="w-full opacity-80 [mask-image:linear-gradient(to_bottom,black_70%,transparent)]"
            />
        </div>
    );
}
