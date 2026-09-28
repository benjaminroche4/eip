import GradientHairline from '@/components/layout/gradient-hairline';
import { type Property } from '@/components/properties/property-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, Phone } from 'lucide-react';

type PropertyAdvisorCardProps = { property: Property; advisor: { id: number; photo: string }; className?: string };

/**
 * Sticky card of the detail page (2026-09-28), the site's card: the price large (monthly for a rental, with the charges
 * note), the price per m², the availability, then the advisor in charge (portrait, one-sentence promise), the primary
 * « Demander une visite » → contact with the listing prefilled (`?property=slug`), the agency phone and the reply
 * promise. Under offer: a notice replaces the promise, the contact button stays (comparable properties).
 */
export default function PropertyAdvisorCard({ property, advisor, className }: PropertyAdvisorCardProps) {
    const { t, locale } = useTranslation();
    const { seo } = usePage<SharedData>().props;
    const isRent = property.transaction === 'rent';
    const perSqm = formatPrice(Math.round(property.price / property.surface), locale);

    return (
        <aside aria-label={t('property.advisor_title')} className={cn('border-secondary-30 bg-card flex border p-2', className)}>
            <div className="from-background-08 to-background-05 flex w-full flex-col gap-5 bg-linear-to-b p-6">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className="font-heading text-3xl font-semibold tabular-nums">
                            <span className="sr-only">{t('properties.price')} </span>
                            {formatPrice(property.price, locale)}
                            {isRent && <span className="text-muted-foreground text-base font-normal"> {t('property.per_month')}</span>}
                        </p>
                        <Badge variant="outline" className="bg-card gap-1.5 rounded-none px-2 py-0.5 text-[0.6875rem] font-medium">
                            <span
                                aria-hidden
                                className={cn('size-1.5 shrink-0 rounded-full', property.available ? 'bg-success' : 'bg-muted-foreground')}
                            />
                            {property.available ? t('properties.available') : t('properties.unavailable')}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm tabular-nums">
                        {isRent
                            ? t(property.charges_included ? 'property.charges_included' : 'property.charges_excluded')
                            : t('properties.per_sqm', { price: perSqm })}
                    </p>
                    <p className="text-muted-foreground text-xs text-pretty">{t(isRent ? 'property.fees_rent' : 'property.fees')}</p>
                </div>
                <GradientHairline />
                <div className="flex items-center gap-3">
                    <Avatar className="ring-card size-12 ring-2">
                        <AvatarImage src={advisor.photo} alt="" loading="lazy" />
                        <AvatarFallback className="bg-background-10 text-foreground text-xs font-medium">{String(advisor.id)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <p className="text-sm font-medium">{t('property.advisor_title')}</p>
                        <p className="text-muted-foreground text-xs text-pretty">
                            {property.available ? t('property.advisor_text') : t('property.unavailable_notice')}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <Button asChild size="lg" className="w-full">
                        <Link href={route('contact', { property: property.slug })} prefetch>
                            {t('property.contact_cta')}
                            <ArrowUpRight aria-hidden />
                        </Link>
                    </Button>
                    {seo.organization.phone && (
                        <Button asChild variant="outline" size="lg" className="bg-card w-full">
                            <a href={`tel:${seo.organization.phone.replace(/\s/g, '')}`}>
                                <Phone aria-hidden />
                                {t('property.call')}
                            </a>
                        </Button>
                    )}
                    <p className="text-muted-foreground text-center text-xs">{t('property.reply')}</p>
                </div>
            </div>
        </aside>
    );
}
