import { useTranslation } from '@/hooks/use-translation';
import { BadgeCheck, Handshake, MapPinned } from 'lucide-react';

const BENEFITS = [
    { key: 'benefit_1', icon: BadgeCheck },
    { key: 'benefit_2', icon: Handshake },
    { key: 'benefit_3', icon: MapPinned },
] as const;

/** Three arguments under the contact block (Figma 261-7447), separated by vertical hairlines on desktop. */
export default function ContactBenefits() {
    const { t } = useTranslation();

    return (
        <section aria-label={t('contact.benefits_label')} className="py-10">
            <ul className="flex flex-col gap-10 lg:flex-row lg:items-stretch lg:gap-10">
                {BENEFITS.map(({ key, icon: Icon }, i) => (
                    <li key={key} className="flex flex-1 items-center gap-10">
                        {i > 0 && <span aria-hidden className="bg-border hidden h-30 w-px shrink-0 lg:block" />}
                        <div className="flex flex-1 flex-col items-center gap-6 text-center">
                            <span className="bg-background-05 flex size-13 items-center justify-center">
                                <Icon aria-hidden className="size-7" strokeWidth={1.5} />
                            </span>
                            <div className="flex flex-col gap-2">
                                <h2 className="font-sans text-lg font-medium sm:text-base">{t(`contact.${key}_title`)}</h2>
                                <p className="text-muted-foreground mx-auto max-w-xs text-base/7 sm:text-sm/6">{t(`contact.${key}_text`)}</p>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
