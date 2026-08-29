import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, Check, CircleCheckBig, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type EstimateSuccessProps = { message: string };

/**
 * Confirmation shown in place of the valuation form once sent (Figma 696-13309 desktop / 696-13603 mobile):
 * check badge, title + text, the request reference (copyable), the advisor card, the three next steps, a CTA to the properties.
 */
export default function EstimateSuccess({ message }: EstimateSuccessProps) {
    const { t } = useTranslation();
    const { seo, flash } = usePage<SharedData>().props;
    const title = useRef<HTMLHeadingElement>(null);
    const [copied, setCopied] = useState(false);

    // Move focus to the confirmation so keyboard / screen-reader users land on it after the redirect.
    useEffect(() => title.current?.focus({ preventScroll: true }), []);

    const advisor = seo.advisor;
    const reference = flash.valuationReference;

    const copy = async () => {
        if (!reference) return;
        try {
            await navigator.clipboard.writeText(reference);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            /* clipboard unavailable: the reference stays visible anyway */
        }
    };

    const chips = advisor
        ? [
              advisor.experienceYears && t('estimate.advisor_experience', { years: advisor.experienceYears }),
              t('estimate.advisor_languages'),
              t('estimate.trust_delay'),
          ].filter(Boolean)
        : [];
    const steps = [t('estimate.next_step_1'), t('estimate.next_step_2'), t('estimate.next_step_3')];

    return (
        <div
            role="status"
            className="border-grey-30 mx-auto flex max-w-3xl flex-col items-center gap-10 border border-dashed px-4 py-10 text-center sm:p-15"
        >
            <div className="flex flex-col items-center gap-4 sm:gap-5">
                <span className="bg-success-10 flex size-13 items-center justify-center rounded-full sm:size-16">
                    <CircleCheckBig aria-hidden className="text-success-60 size-7 sm:size-9" strokeWidth={1.5} />
                </span>
                <div className="flex flex-col gap-3">
                    <h2 ref={title} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-balance focus:outline-none sm:text-3xl">
                        {t('estimate.success_title')}
                    </h2>
                    <p className="text-muted-foreground mx-auto max-w-md text-base/7 text-pretty sm:text-sm/6">{message}</p>
                </div>
                {reference && (
                    <p className="bg-grey-5 flex items-center gap-2.5 px-3 py-2.5 text-base sm:text-sm">
                        <span>{t('estimate.reference')}</span>
                        <span className="font-semibold tabular-nums">{reference}</span>
                        <button
                            type="button"
                            onClick={copy}
                            aria-label={copied ? t('estimate.copied') : t('estimate.copy_reference')}
                            className="focus-ring text-muted-foreground hover:text-foreground rounded-none"
                        >
                            {copied ? <Check aria-hidden className="text-success size-4" /> : <Copy aria-hidden className="size-4" />}
                        </button>
                        <span role="status" className="sr-only">
                            {copied ? t('estimate.copied') : ''}
                        </span>
                    </p>
                )}
            </div>

            <div className="flex w-full flex-col gap-2">
                {advisor && (
                    <section
                        aria-labelledby="estimate-advisor-title"
                        className="bg-background-08 border-secondary-40 flex flex-col gap-1 border p-1.5"
                    >
                        <h3 id="estimate-advisor-title" className="text-muted-foreground py-1 text-center font-sans text-sm font-medium">
                            {t('contact.meet_advisor')}
                        </h3>
                        <div className="bg-card flex flex-col items-center gap-4 px-2 py-4 sm:p-5">
                            <div className="flex flex-col items-center gap-3">
                                <Avatar className="size-14 rounded-none sm:size-16">
                                    <AvatarImage src={advisor.photo} alt="" className="rounded-none object-cover" />
                                    <AvatarFallback className="bg-background-10 text-foreground rounded-none text-base font-medium">
                                        {advisor.name
                                            .split(' ')
                                            .map((w) => w[0])
                                            .join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col gap-1">
                                    <p className="font-heading text-base font-semibold sm:text-lg">{advisor.name}</p>
                                    {advisor.role && <p className="text-muted-foreground text-sm">{advisor.role}</p>}
                                </div>
                            </div>
                            <ul role="list" className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                                {chips.map((chip) => (
                                    <li key={chip as string} className="bg-grey-5 flex items-center gap-2 px-2 py-1.5 text-xs sm:text-sm">
                                        <Check aria-hidden className="size-3.5 shrink-0" />
                                        {chip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                )}

                {/* Next steps: the first is done (the request is in), the second is next, the third waits */}
                <section aria-labelledby="estimate-steps-title" className="bg-background-08 border-secondary-40 border p-4 sm:p-5">
                    <h3 id="estimate-steps-title" className="sr-only">
                        {t('estimate.next_steps')}
                    </h3>
                    <ol className="flex flex-col sm:flex-row sm:items-start">
                        {steps.map((step, index) => {
                            const done = index === 0;
                            const next = index === 1;
                            return (
                                <li key={step} className="flex items-start gap-3 sm:flex-1 sm:flex-col sm:items-center sm:gap-3">
                                    {/* Disc with its connectors: vertical dotted line on mobile, horizontal on desktop */}
                                    <div className="flex flex-col items-center self-stretch sm:w-full sm:flex-row sm:self-auto">
                                        <span
                                            aria-hidden
                                            className={cn('border-grey-30 hidden flex-1 border-t border-dotted sm:block', index === 0 && 'invisible')}
                                        />
                                        <span
                                            className={cn(
                                                'flex size-4 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums',
                                                done || next ? 'bg-primary text-primary-foreground' : 'bg-primary-20 text-muted-foreground',
                                            )}
                                        >
                                            {done ? <Check aria-hidden className="size-2.5" strokeWidth={3} /> : index + 1}
                                            {done && <span className="sr-only">{t('estimate.recap_group_done')}</span>}
                                        </span>
                                        <span
                                            aria-hidden
                                            className={cn(
                                                'border-grey-30 hidden flex-1 border-t border-dotted sm:block',
                                                index === steps.length - 1 && 'invisible',
                                            )}
                                        />
                                        <span
                                            aria-hidden
                                            className={cn(
                                                'border-grey-30 my-1 min-h-5 flex-1 border-l border-dotted sm:hidden',
                                                index === steps.length - 1 && 'invisible',
                                            )}
                                        />
                                    </div>
                                    <p className="pb-5 text-sm font-medium sm:pb-0 sm:text-center">{step}</p>
                                </li>
                            );
                        })}
                    </ol>
                </section>
            </div>

            <Button asChild size="lg">
                <Link href={route('buy')} prefetch>
                    {t('estimate.browse_properties')}
                    <ArrowUpRight aria-hidden />
                </Link>
            </Button>
        </div>
    );
}
