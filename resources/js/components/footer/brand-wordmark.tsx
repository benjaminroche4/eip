import { cn } from '@/lib/utils';

type BrandWordmarkProps = { className?: string };

/** Outlined wordmark (public/brand/wordmark-outline.svg, Secondary/80) fading out towards the bottom; cropped at 160 % on mobile. Decorative. */
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
                className="w-[160%] max-w-none opacity-80 [mask-image:linear-gradient(to_bottom,black_70%,transparent)] sm:w-full"
            />
        </div>
    );
}
