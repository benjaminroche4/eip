import { cn } from '@/lib/utils';

type BrandWordmarkProps = { className?: string };

/** Full-width outlined wordmark (public/brand/wordmark-outline.svg, Secondary/80), fading out towards the bottom. Decorative. */
export default function BrandWordmark({ className }: BrandWordmarkProps) {
    return (
        <img
            src="/brand/wordmark-outline.svg"
            alt=""
            aria-hidden
            width={1276}
            height={118}
            loading="lazy"
            decoding="async"
            className={cn('hidden w-full opacity-80 [mask-image:linear-gradient(to_bottom,black_70%,transparent)] sm:block', className)}
        />
    );
}
