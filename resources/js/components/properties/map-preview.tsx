import { type Property } from '@/components/properties/property-card';
import SeoImage from '@/components/seo/seo-image';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { formatPrice } from '@/lib/format-price';
import { ordinal } from '@/lib/ordinal';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

type MapPreviewProps = { property: Property; onClose: () => void; onShow: (slug: string) => void };

/* ————— Pieces ————— */

function Photo({ property, className }: { property: Property; className?: string }) {
    return (
        <SeoImage
            src={property.photos[0].replace('{w}', '800')}
            alt={property.photo_alt}
            width={800}
            height={600}
            className={cn('object-cover', className)}
        />
    );
}

function Price({ property, className }: { property: Property; className?: string }) {
    const { t, locale } = useTranslation();
    return (
        <p className={cn('font-heading text-lg font-semibold tabular-nums', className)}>
            {formatPrice(property.price, locale)}
            {property.transaction === 'rent' && <span className="text-muted-foreground text-xs font-normal"> {t('properties.per_month')}</span>}
        </p>
    );
}

function Facts({ property, className }: { property: Property; className?: string }) {
    const { t, tc, locale } = useTranslation();
    return (
        <p className={cn('text-muted-foreground text-xs tabular-nums', className)}>
            Paris {ordinal(property.arrondissement, locale)} · {tc('properties.bedrooms', property.bedrooms, { count: property.bedrooms })} ·{' '}
            {t('properties.surface', { surface: property.surface })}
        </p>
    );
}

function Show({
    property,
    onShow,
    variant = 'outline',
    className,
}: {
    property: Property;
    onShow: (slug: string) => void;
    variant?: 'outline' | 'default' | 'neutral';
    className?: string;
}) {
    const { t } = useTranslation();
    // A real link to the detail page (2026-09-28); `onShow` still lets the page close the map view / the mini card
    return (
        <Button asChild variant={variant} size="sm" className={className}>
            <Link href={route('properties.show', { slug: property.slug })} prefetch onClick={() => onShow(property.slug)}>
                {t('properties.preview_show')}
            </Link>
        </Button>
    );
}

function Close({ onClose, className }: { onClose: () => void; className?: string }) {
    const { t } = useTranslation();
    return (
        <button
            type="button"
            aria-label={t('properties.preview_close')}
            onClick={onClose}
            className={cn(
                'focus-ring text-muted-foreground hover:text-foreground absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-none transition-colors duration-300 motion-reduce:transition-none',
                className,
            )}
        >
            <X aria-hidden className="size-4" />
        </button>
    );
}

/**
 * Mini card anchored above the chosen price chip (portalled into an overlay marker by `PropertiesMap`, user decision
 * 2026-09-26): first photo, price, title, arrondissement and the facts, a « Voir le bien » that scrolls to the full
 * card as a full-width primary button under the row (ui.sh variant chosen among 20, user decision 2026-09-28), a
 * close button. Focus moves in on open, Escape closes, `aria-live` announces the change.
 */
export default function MapPreview({ property, onClose, onShow }: MapPreviewProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        ref.current?.focus({ preventScroll: true });
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [property.slug, onClose]);

    return (
        <div
            ref={ref}
            tabIndex={-1}
            role="dialog"
            aria-label={property.title}
            aria-live="polite"
            className="border-border bg-card focus-ring animate-panel-in relative flex w-72 flex-col border p-1.5 motion-reduce:animate-none"
        >
            {/* Photo + facts on one row, then the full-width primary « Voir le bien » — ui.sh variant « Bouton plein pleine largeur »
                chosen among 20 (user decision 2026-09-28) */}
            <div className="flex gap-3 pr-8">
                <Photo property={property} className="aspect-[4/3] w-24 shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col gap-1 py-1">
                    <Price property={property} />
                    <p className="truncate text-sm">{property.title}</p>
                    <Facts property={property} />
                </div>
            </div>
            <Show property={property} onShow={onShow} variant="default" className="mt-1.5 w-full" />
            <Close onClose={onClose} />
        </div>
    );
}
