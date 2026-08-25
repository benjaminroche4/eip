import ContactDetail from '@/components/contact/contact-detail';
import SocialLinks from '@/components/footer/social-links';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Mail, MapPin, Phone } from 'lucide-react';

/** Left column of the contact page (Figma 261-7360): phone (+ WhatsApp), e-mail, office, social links. */
export default function ContactDetails() {
    const { seo } = usePage<SharedData>().props;
    const { t } = useTranslation();
    const { phone, whatsapp, email, address } = seo.organization;
    const hasAddress = Boolean(address.street && address.city);

    return (
        <div className="flex flex-col gap-7">
            {phone && (
                <>
                    <ContactDetail icon={Phone} label={t('contact.call_us')}>
                        <a href={`tel:${phone.replace(/\s/g, '')}`} className="focus-ring w-fit font-medium hover:underline">
                            {phone}
                        </a>
                        {whatsapp && (
                            <p className="flex items-center gap-1.5">
                                {t('contact.available_on')}
                                <a
                                    href={`https://wa.me/${whatsapp}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="focus-ring text-success underline underline-offset-2 hover:no-underline"
                                >
                                    {t('contact.whatsapp')}
                                    <span className="sr-only"> {t('footer.new_tab')}</span>
                                </a>
                            </p>
                        )}
                    </ContactDetail>
                    <Separator />
                </>
            )}

            {email && (
                <>
                    <ContactDetail icon={Mail} label={t('contact.email_us')}>
                        <a href={`mailto:${email}`} className="focus-ring w-fit font-medium break-all hover:underline">
                            {email}
                        </a>
                    </ContactDetail>
                    <Separator />
                </>
            )}

            {hasAddress && (
                <ContactDetail icon={MapPin} label={t('contact.visit_us')}>
                    <address className="flex flex-col gap-1 not-italic">
                        <p className="flex flex-wrap items-center gap-2 font-medium">
                            {address.street}
                            <Badge variant="outline" className="border-border bg-background-05 text-muted-foreground font-medium">
                                {t('contact.head_office')}
                            </Badge>
                        </p>
                        <p>
                            {address.postal_code} {address.city}
                            {address.country === 'FR' && ', France'}
                        </p>
                    </address>
                </ContactDetail>
            )}

            <SocialLinks className="pt-2" />
        </div>
    );
}
