import ContactDetail from '@/components/contact/contact-detail';
import GradientHairline from '@/components/layout/gradient-hairline';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';
import { linkClass } from '@/lib/hover-surface';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Mail, MapPin, Phone } from 'lucide-react';

/** Left column of the contact page (Figma 261-7360): phone (+ WhatsApp), e-mail, office, social links. */
export default function ContactDetails() {
    const { seo } = usePage<SharedData>().props;
    const { t } = useTranslation();
    const { phone, whatsapp, email, address } = seo.organization;
    const hasAddress = Boolean(address.street && address.city);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([address.street, address.postal_code, address.city].filter(Boolean).join(' '))}`;

    return (
        <div className="flex flex-col gap-7">
            {hasAddress && (
                <>
                    <ContactDetail icon={MapPin} label={t('contact.visit_us')}>
                        <Badge variant="outline" className="w-fit">
                            {t('contact.head_office')}
                        </Badge>
                        <address className="flex flex-col gap-0.5 not-italic">
                            <p className="text-lg font-semibold">{address.street}</p>
                            <p className="text-muted-foreground">
                                {address.postal_code} {address.city}
                                {address.country === 'FR' && ', France'}
                            </p>
                        </address>
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={cn('focus-ring w-fit text-sm', linkClass)}>
                            {t('contact.view_on_maps')}
                            <span className="sr-only"> {t('footer.new_tab')}</span>
                        </a>
                    </ContactDetail>
                    <GradientHairline />
                </>
            )}

            {phone && (
                <>
                    <ContactDetail icon={Phone} label={t('contact.call_us')}>
                        <a href={`tel:${phone.replace(/\s/g, '')}`} className="focus-ring w-fit text-lg font-semibold">
                            {phone}
                        </a>
                        <p className="text-muted-foreground text-balance">{t('contact.hours_line')}</p>
                        {whatsapp && (
                            <p className="flex items-center gap-1.5">
                                {t('contact.available_on')}
                                <a
                                    href={`https://wa.me/${whatsapp}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn('focus-ring text-success', linkClass)}
                                >
                                    {t('contact.whatsapp')}
                                    <span className="sr-only"> {t('footer.new_tab')}</span>
                                </a>
                            </p>
                        )}
                    </ContactDetail>
                    <GradientHairline />
                </>
            )}

            {email && (
                <ContactDetail icon={Mail} label={t('contact.email_us')}>
                    <a href={`mailto:${email}`} className="focus-ring w-fit text-lg font-semibold break-all">
                        {email}
                    </a>
                    <p className="text-muted-foreground text-balance">{t('contact.email_response')}</p>
                </ContactDetail>
            )}
        </div>
    );
}
