import SeoImage from '@/components/seo/seo-image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

type Props = {
    title: string;
    text: string;
    cta: { label: string; href: string };
    image: { src: string; width: number; height: number };
    onNavigate?: () => void;
    className?: string;
};

/** Image card with dark overlay, centred copy and a small neutral button (Figma 137-3488). */
export default function MegaMenuPromo({ title, text, cta, image, onNavigate, className }: Props) {
    return (
        <div
            className={cn(
                'group/promo relative flex flex-col items-center justify-center gap-5 overflow-hidden rounded-sm p-5 text-center text-white',
                className,
            )}
        >
            <SeoImage
                src={image.src}
                alt=""
                width={image.width}
                height={image.height}
                className="absolute inset-0 size-full scale-100 object-cover transition-transform duration-[1200ms] ease-out group-hover/promo:scale-105 motion-reduce:transition-none"
            />
            <div aria-hidden className="bg-primary-100/40 group-hover/promo:bg-primary-100/50 absolute inset-0 transition-colors duration-700" />
            <div className="relative flex flex-col items-center gap-1">
                <p className="font-heading text-xl font-semibold">{title}</p>
                <p className="max-w-sm text-sm opacity-90">{text}</p>
            </div>
            <Button
                asChild
                variant="secondary"
                size="sm"
                className="bg-card text-foreground hover:bg-background-05 relative font-normal transition-[background-color,transform] duration-300 ease-out hover:-translate-y-px"
            >
                <Link href={cta.href} onClick={onNavigate}>
                    {cta.label}
                </Link>
            </Button>
        </div>
    );
}
