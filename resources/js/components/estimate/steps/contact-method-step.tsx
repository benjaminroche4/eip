import SelectionCards, { type SelectionOption } from '@/components/estimate/selection-cards';
import StepHeading from '@/components/estimate/step-heading';
import { type EstimateStepProps } from '@/components/estimate/types';
import { useTranslation } from '@/hooks/use-translation';
import { focusField } from '@/lib/focus-field';
import { Info, type LucideIcon, Mail, MessageCircle, Phone } from 'lucide-react';

const CONTACT_ICONS: Record<string, LucideIcon> = { phone: Phone, whatsapp: MessageCircle, email: Mail };

type ContactMethodStepProps = EstimateStepProps & {
    contactMethods: string[];
};

/** Step 4 — preferred contact method as selection cards (+ WhatsApp hint); picking one moves the focus to the note. */
export default function ContactMethodStep({ data, setData, errors, complete, contactMethods }: ContactMethodStepProps) {
    const { t } = useTranslation();
    const options: SelectionOption[] = contactMethods.map((value) => ({
        value,
        label: t(`estimate.contact_methods.${value}`),
        icon: CONTACT_ICONS[value] ?? Phone,
    }));

    return (
        <fieldset aria-labelledby="step-method" className="flex flex-col gap-6 py-10">
            <StepHeading number={4} id="step-method" complete={complete}>
                {t('estimate.step_method')}
            </StepHeading>
            <SelectionCards
                id="contact_method"
                name="contact_method"
                value={data.contact_method}
                onChange={(v) => {
                    setData('contact_method', v);
                    focusField('message');
                }}
                options={options}
                aria-labelledby="step-method"
                aria-invalid={Boolean(errors.contact_method)}
            />
            {data.contact_method === 'whatsapp' && (
                <p className="text-muted-foreground flex items-start gap-2 text-sm">
                    <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
                    {t('estimate.whatsapp_hint')}
                </p>
            )}
        </fieldset>
    );
}
