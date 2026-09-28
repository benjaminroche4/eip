import SeoImage from '@/components/seo/seo-image';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type KeyboardEvent, useState } from 'react';

type PropertyGalleryProps = {
    /** `{w}` templates, 800 and 1600 available. */
    photos: string[];
    alt: string;
    title: string;
};

/**
 * Gallery of the detail page (2026-09-28): the chosen photo large (3/2, square corners, edge to edge on mobile,
 * eager for the LCP), a row of square thumbnails under it (buttons, `aria-pressed` on the shown one, arrows move the
 * choice, the row scrolls sideways when it overflows). A single photo shows alone, without thumbnails.
 */
export default function PropertyGallery({ photos, alt, title }: PropertyGalleryProps) {
    const { t } = useTranslation();
    const [index, setIndex] = useState(0);
    const count = photos.length;
    const src = (photo: string, w: 800 | 1600) => photo.replace('{w}', String(w));
    const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
        const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (delta === 0) return;
        e.preventDefault();
        const next = (i + delta + count) % count;
        setIndex(next);
        (e.currentTarget.parentElement?.parentElement?.querySelectorAll('button')[next] as HTMLButtonElement | undefined)?.focus();
    };

    return (
        <div className="flex flex-col gap-2" role="group" aria-label={t('properties.photos_label', { title })}>
            <div className="bg-background-05 -mx-6 overflow-hidden sm:mx-0">
                <SeoImage
                    key={photos[index]}
                    src={src(photos[index], 1600)}
                    srcSet={`${src(photos[index], 800)} 800w, ${src(photos[index], 1600)} 1600w`}
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    alt={index === 0 ? alt : t('properties.photo_n', { alt, n: index + 1, count })}
                    width={1600}
                    height={1067}
                    priority={index === 0}
                    className="aspect-[3/2] w-full object-cover"
                />
            </div>
            {count > 1 && (
                <ul
                    role="list"
                    className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
                >
                    {photos.map((photo, i) => (
                        <li key={photo} className="shrink-0">
                            <button
                                type="button"
                                aria-pressed={i === index}
                                aria-label={t('property.gallery_thumb', { n: i + 1 })}
                                onClick={() => setIndex(i)}
                                onKeyDown={(e) => onKeyDown(e, i)}
                                className={cn(
                                    'focus-ring block overflow-hidden border-2 transition-colors duration-300 motion-reduce:transition-none',
                                    i === index ? 'border-primary' : 'hover:border-secondary-60 border-transparent',
                                )}
                            >
                                <SeoImage src={src(photo, 800)} alt="" width={800} height={600} className="aspect-[4/3] w-24 object-cover sm:w-28" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <p className="sr-only" aria-live="polite">
                {t('properties.photo_count', { n: index + 1, count })}
            </p>
        </div>
    );
}
