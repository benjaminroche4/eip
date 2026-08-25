import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, Check, CircleCheckBig } from 'lucide-react';
import { useEffect, useRef } from 'react';

type ContactSuccessProps = { message: string };

/**
 * Confirmation shown in place of the form once a request is sent (Figma 261-6726 desktop / 150-3164 mobile):
 * check badge, title, the flash message, the advisor card (from config seo.advisor) and a CTA to the properties.
 */
export default function ContactSuccess({ message }: ContactSuccessProps) {
    const { t } = useTranslation();
    const { seo } = usePage<SharedData>().props;
    const title = useRef<HTMLHeadingElement>(null);

    // Move focus to the confirmation so keyboard / screen-reader users land on it after the redirect.
    useEffect(() => title.current?.focus({ preventScroll: true }), []);

    const advisor = seo.advisor;
    const highlights = [
        advisor?.experienceYears ? t('contact.advisor_experience', { years: advisor.experienceYears }) : null,
        t('contact.advisor_languages'),
        t('contact.advisor_response'),
    ].filter((h): h is string => Boolean(h));

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
                <section aria-labelledby="advisor-title" className="bg-secondary-30 flex w-full max-w-lg flex-col gap-1 p-1">
                    <h3 id="advisor-title" className="text-muted-foreground py-1 font-sans text-sm font-medium">
                        {t('contact.meet_advisor')}
                    </h3>
                    <div className="bg-card flex flex-col items-center gap-4 px-2 py-4 sm:p-5">
                        <div className="flex flex-col items-center gap-3">
                            <Avatar className="size-14 rounded-none sm:size-16">
                                <AvatarImage src={advisor.photo} alt="" className="rounded-none object-cover" />
                                <AvatarFallback className="bg-background-10 text-foreground rounded-none text-sm font-medium">
                                    {advisor.name
                                        .split(' ')
                                        .map((w) => w[0])
                                        .join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-1">
                                <p className="font-heading text-base font-medium">{advisor.name}</p>
                                {advisor.role && <p className="text-muted-foreground text-sm">{advisor.role}</p>}
                            </div>
                        </div>
                        <ul className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                            {highlights.map((h) => (
                                <li key={h}>
                                    <Badge variant="secondary" className="gap-1.5 px-2 py-1 text-xs font-normal sm:text-sm">
                                        <Check aria-hidden className="size-3.5" />
                                        {h}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}

            <Button asChild size="lg">
                <Link href={route('buy')} prefetch>
                    {t('contact.browse_properties')}
                    <ArrowUpRight aria-hidden />
                </Link>
            </Button>
        </div>
    );
}
