import FormField from '@/components/contact/form-field';
import PhoneInput from '@/components/contact/phone-input';
import StepHeading from '@/components/estimate/step-heading';
import { type EstimateStepProps, type EstimateValidity } from '@/components/estimate/types';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

type ContactStepProps = EstimateStepProps & {
    valid: EstimateValidity;
};

/** Step 2 — who to contact: name, e-mail and phone, with a quiet green check once e-mail / phone are valid. */
export default function ContactStep({ data, setData, errors, complete, valid }: ContactStepProps) {
    const { t } = useTranslation();

    const validMark = (
        <span className="text-success pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
            <Check aria-hidden className="animate-pop size-4 motion-reduce:animate-none" />
            <span className="sr-only">{t('estimate.valid')}</span>
        </span>
    );

    return (
        <fieldset aria-labelledby="step-contact" className="flex flex-col gap-6 py-10">
            <StepHeading number={2} id="step-contact" complete={complete}>
                {t('estimate.step_contact')}
            </StepHeading>
            <FormField id="full_name" label={t('estimate.full_name')} error={errors.full_name} required>
                {(aria) => (
                    <Input
                        {...aria}
                        name="full_name"
                        autoComplete="name"
                        placeholder={t('estimate.full_name_placeholder')}
                        value={data.full_name}
                        onChange={(e) => setData('full_name', e.target.value)}
                    />
                )}
            </FormField>
            <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
                <FormField id="email" label={t('estimate.email')} error={errors.email} required>
                    {(aria) => (
                        <div className="relative">
                            <Input
                                {...aria}
                                type="email"
                                name="email"
                                autoComplete="email"
                                inputMode="email"
                                placeholder={t('estimate.email_placeholder')}
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className={cn(valid.email && 'pr-9')}
                            />
                            {valid.email && validMark}
                        </div>
                    )}
                </FormField>
                <FormField id="phone" label={t('estimate.phone')} error={errors.phone} required>
                    {(aria) => (
                        <div className="relative">
                            <PhoneInput {...aria} name="phone" value={data.phone} onChange={(v) => setData('phone', v)} />
                            {valid.phone && validMark}
                        </div>
                    )}
                </FormField>
            </div>
        </fieldset>
    );
}
