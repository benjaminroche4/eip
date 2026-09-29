import { type Property } from '@/components/properties/property-card';
import PropertyPhotos from '@/components/properties/property-photos';
import { useTranslation } from '@/hooks/use-translation';

type PropertyDescriptionProps = { property: Property };

/**
 * Description of the detail page — ui.sh « Filets entre paragraphes » chosen among 30 (user decision 2026-09-29): the
 * paragraphs read one under the other, separated by hairlines; the first one is the lead (larger, in the heading
 * colour), the following ones read in the body colour. Falls back to the card excerpt when the listing has no long
 * description. **A photo carousel sits inside the text** (user request 2026-09-29): after the lead, the listing's
 * photos in the cards' snap carousel (`PropertyPhotos`, 16/9 at the column's width, arrows, dots, counter), the
 * rest of the paragraphs under it.
 */
export default function PropertyDescription({ property }: PropertyDescriptionProps) {
    const { t } = useTranslation();
    const paragraphs = property.description && property.description.length > 0 ? property.description : [property.excerpt];

    const [lead, ...rest] = paragraphs;
    const carousel = property.photos.length > 1 && (
        <div className="py-5">
            <PropertyPhotos
                photos={property.photos}
                alt={property.photo_alt}
                title={property.title}
                imageClass="aspect-video"
                sizes="(min-width: 64rem) 48rem, 100vw"
                label={t('property.description_photos')}
            />
        </div>
    );

    return (
        <div className="divide-border/60 flex flex-col divide-y text-base/8">
            <p className="text-foreground pb-5 text-lg/9 text-pretty">{lead}</p>
            {carousel}
            {rest.map((paragraph) => (
                <p key={paragraph} className="text-muted-foreground py-5 text-pretty last:pb-0">
                    {paragraph}
                </p>
            ))}
        </div>
    );
}
