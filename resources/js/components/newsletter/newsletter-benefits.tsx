import GradientHairline from '@/components/layout/gradient-hairline';
import { useTranslation } from '@/hooks/use-translation';
import { BadgeCheck, ChartNoAxesCombined, type LucideIcon, Timer } from 'lucide-react';
import { Fragment } from 'react';

const BENEFITS: { key: 'opportunities' | 'guidance' | 'expertise'; icon: LucideIcon }[] = [
    { key: 'opportunities', icon: BadgeCheck },
    { key: 'guidance', icon: ChartNoAxesCombined },
    { key: 'expertise', icon: Timer },
];

/** Three reasons to subscribe (Figma 262-7913): icon tile, title, text — gradient hairline between items (horizontal on mobile, vertical on desktop). */
export default function NewsletterBenefits() {
    const { t } = useTranslation();

    return (
        <section aria-labelledby="newsletter-benefits-title" className="w-full px-7 py-6 lg:px-0 lg:py-10">
            <h2 id="newsletter-benefits-title" className="sr-only">
                {t('newsletter.benefits_title')}
            </h2>
            <ul role="list" className="flex flex-col lg:flex-row lg:items-stretch">
                {BENEFITS.map(({ key, icon: Icon }, index) => (
                    <Fragment key={key}>
                        {index > 0 && (
                            <li role="presentation" aria-hidden className="flex lg:w-px">
                                <GradientHairline className="via-grey-30 lg:hidden" />
                                <GradientHairline vertical className="hidden lg:block" />
                            </li>
                        )}
                        <li className="flex flex-1 flex-col items-center gap-6 px-5 py-8 text-center lg:py-0">
                            {/* Same icon tile as the contact details (contact-detail.tsx) */}
                            <span
                                aria-hidden
                                className="bg-background-05 text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-full"
                            >
                                <Icon className="size-4" />
                            </span>
                            <div className="flex flex-col gap-2">
                                <h3 className="font-sans text-lg font-medium">{t(`newsletter.benefits.${key}.title`)}</h3>
                                <p className="text-muted-foreground mx-auto max-w-sm text-base/7 sm:text-sm/6">
                                    {t(`newsletter.benefits.${key}.text`)}
                                </p>
                            </div>
                        </li>
                    </Fragment>
                ))}
            </ul>
        </section>
    );
}
