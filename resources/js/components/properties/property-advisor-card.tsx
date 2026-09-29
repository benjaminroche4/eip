import { type Property } from '@/components/properties/property-card';
import VisitForm from '@/components/properties/visit-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/use-translation';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Info, Phone, TrendingDown } from 'lucide-react';
import { type ReactNode } from 'react';

export type Advisor = { id: number; photo: string; name: string | null; role: string | null };

type PropertyAdvisorCardProps = { property: Property; advisor: Advisor; reference: string; className?: string };

/**
 * Sticky card of the detail page (2026-09-28), the site's card: the price large (monthly for a rental, with the charges
 * note), the price per m², the availability, then the advisor in charge (portrait, name and role, in a white sand-lined
 * panel since 2026-09-29), the primary
 * « Demander une visite » → contact with the listing prefilled (`?property=slug`), and the agency phone (the « Réponse sous 24 h ouvrées » line was removed on 2026-09-29, user decision).
 * Under offer or sold: a notice under the advisor, the contact button stays (comparable properties).
 */
export default function PropertyAdvisorCard({ property, advisor, reference, className }: PropertyAdvisorCardProps) {
    const { t, locale } = useTranslation();
    const { seo } = usePage<SharedData>().props;
    const isRent = property.transaction === 'rent';
    const sold = Boolean(property.sold_at);
    const perSqm = formatPrice(Math.round(property.price / property.surface), locale);
    // Price history (2026-09-28): the last drop in percent, nothing when the price never moved (the « Mis en vente le … ·
    // prix inchangé » line was removed on 2026-09-29, user decision)
    const history = property.price_history ?? [];
    const first = history[0];
    const last = history[history.length - 1];
    const drop = first && last && last.price < first.price ? Math.round((1 - last.price / first.price) * 100) : 0;
    const dateOf = (iso: string) =>
        new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const priceBlock = (dark = false) => (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="font-heading text-3xl font-semibold tabular-nums">
                    <span className="sr-only">{t('properties.price')} </span>
                    {formatPrice(property.price, locale)}
                    {isRent && (
                        <span className={cn('text-base font-normal', dark ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                            {' '}
                            {t('property.per_month')}
                        </span>
                    )}
                </p>
                <Badge variant="outline" className="bg-card text-foreground gap-1.5 rounded-none px-2 py-0.5 text-[0.6875rem] font-medium">
                    <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', property.available ? 'bg-success' : 'bg-muted-foreground')} />
                    {sold ? t('property.sold') : property.available ? t('properties.available') : t('properties.unavailable')}
                </Badge>
            </div>
            <p className={cn('flex items-center gap-1.5 text-sm tabular-nums', dark ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                {isRent
                    ? t(property.charges_included ? 'property.charges_included' : 'property.charges_excluded')
                    : t('properties.per_sqm', { price: perSqm })}
                {/* The fees sentence lives in a tooltip on an info icon (user decision 2026-09-29): opens on hover, focus and tap */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                aria-label={t('property.fees_info')}
                                className="focus-ring hover:text-foreground inline-flex size-6 items-center justify-center transition-colors duration-300 motion-reduce:transition-none"
                            >
                                <Info aria-hidden className="size-3.5" strokeWidth={1.5} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-64 text-pretty">
                            {t(isRent ? 'property.fees_rent' : 'property.fees')}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </p>
        </div>
    );
    const meta = (className?: string) =>
        drop > 0 && (
            <p className={cn('text-muted-foreground flex items-center gap-1.5 text-xs tabular-nums', className)}>
                <TrendingDown aria-hidden className="text-success size-3.5" strokeWidth={1.5} />
                {t('property.price_drop', { percent: drop, date: dateOf(last.date) })}
            </p>
        );
    const advisorRow = (size: 'sm' | 'md' | 'lg' = 'md', centered = false) => (
        <div className={cn('flex items-center gap-3', centered && 'flex-col text-center')}>
            <Avatar className={cn('ring-card ring-2', size === 'sm' && 'size-9', size === 'md' && 'size-12', size === 'lg' && 'size-20')}>
                <AvatarImage src={advisor.photo} alt="" loading="lazy" />
                <AvatarFallback className="bg-background-10 text-foreground text-xs font-medium">{String(advisor.id)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                {/* The advisor by name and role (E-E-A-T, redesign 2026-09-28); the heading stays « Votre conseiller » */}
                <p className={cn('font-medium', size === 'lg' ? 'text-base' : 'text-sm')}>{advisor.name ?? t('property.advisor_title')}</p>
                {advisor.role && <p className="text-muted-foreground text-xs">{advisor.role}</p>}
            </div>
        </div>
    );
    // Only a sold or withdrawn listing carries a notice under the advisor (the "single point of contact" line was removed, user decision 2026-09-29)
    const notice = sold ? t('property.sold_notice') : property.available ? null : t('property.unavailable_notice');
    const promise = (className?: string) => notice && <p className={cn('text-muted-foreground text-xs text-pretty', className)}>{notice}</p>;
    const actions = (
        <div className="flex flex-col gap-2">
            {/* The viewing request lives in the card (2026-09-28): slots, fields, sent with the reference */}
            {!sold && <VisitForm property={property} reference={reference} />}
            {seo.organization.phone && (
                <Button asChild variant="outline" size="lg" className="bg-card w-full">
                    <a href={`tel:${seo.organization.phone.replace(/\s/g, '')}`}>
                        <Phone aria-hidden />
                        {t('property.call')}
                    </a>
                </Button>
            )}
        </div>
    );
    const frame = (children: ReactNode, inner = 'from-background-08 to-background-05 flex w-full flex-col gap-5 bg-linear-to-b p-6') => (
        <aside aria-label={t('property.advisor_title')} className={cn('border-secondary-30 bg-card flex border p-2', className)}>
            <div className={inner}>{children}</div>
        </aside>
    );

    return frame(
        <>
            {priceBlock()}
            {meta('-mt-3')}
            {/* The advisor in a white, sand-lined panel (variante ui.sh « Conseiller encadré » choisie parmi 24, 2026-09-29) */}
            <div className="border-secondary-30 bg-card border p-3">{advisorRow('sm')}</div>
            {promise()}
            {actions}
        </>,
    );
}
