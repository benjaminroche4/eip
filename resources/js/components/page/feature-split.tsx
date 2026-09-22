import PageEyebrow from '@/components/page/page-eyebrow';
import SeoImage from '@/components/seo/seo-image';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

type FeatureSplitProps = {
    /** Id of the h2 (the section is labelled by it). */
    id: string;
    eyebrow: string;
    title: string;
    /** Answer-first paragraph (GEO). */
    intro: string;
    /** Short facts under the paragraph (a `<ul>` with a check per item). */
    points?: string[];
    image: { src: string; srcSet: string; alt: string; width?: number; height?: number };
    /** Photo on the left from `lg` (text first by default). */
    reverse?: boolean;
};

/**
 * Text + photo in two columns (2026-09-22, first used on « Vendre »): the site's page header on one side (eyebrow,
 * h2 as a question, answer-first intro, optional check list), a bare **square** photo on the other (user decision 2026-09-22), edge to
 * edge on mobile like the other photo panels. Nothing interactive.
 */
export default function FeatureSplit({ id, eyebrow, title, intro, points = [], image, reverse = false }: FeatureSplitProps) {
    return (
        <section aria-labelledby={id} className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div className={cn('flex flex-col items-center gap-4 text-center lg:items-start lg:text-left', reverse && 'lg:order-2')}>
                <PageEyebrow>{eyebrow}</PageEyebrow>
                <h2 id={id} className="max-w-xl text-2xl font-medium tracking-tight text-balance sm:text-3xl">
                    {title}
                </h2>
                <p className="text-muted-foreground max-w-xl text-base/7 text-pretty sm:text-sm/6">{intro}</p>
                {points.length > 0 && (
                    <ul role="list" className="mt-2 flex flex-col gap-3 text-left">
                        {points.map((point) => (
                            <li key={point} className="flex items-start gap-3 text-sm/6">
                                <span aria-hidden className="bg-background-08 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                                    <Check className="size-3" strokeWidth={2} />
                                </span>
                                {point}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className={cn('relative -mx-6 aspect-square overflow-hidden lg:mx-0', reverse && 'lg:order-1')}>
                <SeoImage
                    src={image.src}
                    srcSet={image.srcSet}
                    sizes="(min-width: 80rem) 36rem, (min-width: 64rem) 50vw, 100vw"
                    alt={image.alt}
                    width={image.width ?? 1600}
                    height={image.height ?? 1067}
                    className="absolute inset-0 size-full object-cover"
                />
            </div>
        </section>
    );
}
