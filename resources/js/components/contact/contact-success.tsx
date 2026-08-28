import CountryFlag from '@/components/i18n/country-flag';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CircleCheckBig, Info } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { formatPhoneNumberIntl } from 'react-phone-number-input';

type ContactSuccessProps = { message: string };

/**
 * Confirmation shown in place of the form once a request is sent (Figma 261-6726 desktop / 150-3164 mobile):
 * check badge, title, the flash message, the advisor card (Figma 261-6733, from config seo.advisor) and a CTA to the properties.
 */
export default function ContactSuccess({ message }: ContactSuccessProps) {
    const { t } = useTranslation();
    const { seo, flash } = usePage<SharedData>().props;
    const title = useRef<HTMLHeadingElement>(null);

    // Move focus to the confirmation so keyboard / screen-reader users land on it after the redirect.
    useEffect(() => title.current?.focus({ preventScroll: true }), []);

    const advisor = seo.advisor;

    return (
        <div role="status" className="flex flex-col items-center gap-8 py-2 text-center sm:gap-10">
            <div className="flex flex-col items-center gap-4 sm:gap-6">
                <span className="bg-card flex size-13 items-center justify-center rounded-full sm:size-16">
                    <CircleCheckBig aria-hidden className="text-success size-7 sm:size-9" strokeWidth={1.5} />
                </span>
                <div className="flex flex-col gap-3">
                    <h2 ref={title} tabIndex={-1} className="text-2xl font-medium tracking-tight text-balance focus:outline-none">
                        {t('contact.success_title')}
                    </h2>
                    <p className="text-muted-foreground mx-auto max-w-md text-base/7 sm:text-sm/6">{message}</p>
                </div>
            </div>

            {advisor && (
                <section aria-labelledby="advisor-title" className="bg-secondary-30 flex w-full max-w-md flex-col gap-1 p-1">
                    <h3 id="advisor-title" className="text-muted-foreground py-1 text-center font-sans text-sm font-medium">
                        {t('contact.meet_advisor')}
                    </h3>
                    <div className="bg-card flex flex-col items-center gap-5 p-5">
                        <div className="flex flex-col items-center gap-3">
                            <Avatar className="size-32 rounded-none sm:size-36">
                                <AvatarImage src={advisor.photo} alt="" className="rounded-none object-cover" />
                                <AvatarFallback className="bg-background-10 text-foreground rounded-none text-base font-medium">
                                    {advisor.name
                                        .split(' ')
                                        .map((w) => w[0])
                                        .join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-1">
                                <p className="font-heading flex items-center justify-center gap-2 text-lg font-semibold">
                                    {advisor.name}
                                    <span role="img" aria-label={t('contact.advisor_languages')} className="flex items-center gap-1">
                                        <CountryFlag country="FR" />
                                        <CountryFlag country="GB" />
                                    </span>
                                </p>
                                {advisor.role && <p className="text-muted-foreground text-sm">{advisor.role}</p>}
                            </div>
                        </div>

                        {/* Key facts: two bordered tiles, the value is the loud part, labels stay small */}
                        <div className="flex w-full flex-col gap-2">
                            <div className="border-border bg-grey-5 flex flex-col gap-0.5 border px-4 py-3">
                                <p className="text-muted-foreground text-xs">{t('contact.advisor_delay_label')}</p>
                                <p className="text-base font-semibold">{t('contact.advisor_delay_value')}</p>
                                <p className="text-muted-foreground text-xs">{t('contact.advisor_delay_hours')}</p>
                            </div>
                            {flash.callbackPhone && (
                                <div className="border-border bg-grey-5 flex flex-col gap-0.5 border px-4 py-3">
                                    <p className="text-muted-foreground text-xs">{t('contact.callback_on')}</p>
                                    <p className="text-base font-semibold tabular-nums">
                                        {formatPhoneNumberIntl(flash.callbackPhone) || flash.callbackPhone}
                                    </p>
                                </div>
                            )}
                        </div>

                        <p className="text-muted-foreground flex items-start gap-1.5 text-left text-xs/5">
                            <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                            {t('contact.advisor_unavailable')}
                        </p>
                    </div>
                </section>
            )}

            <Button asChild size="lg">
                <Link href={route('home')} prefetch>
                    <ArrowLeft aria-hidden />
                    {t('contact.back_home')}
                </Link>
            </Button>
        </div>
    );
}
