import FormField from '@/components/contact/form-field';
import StepHeading from '@/components/estimate/step-heading';
import { type EstimateStepProps, MESSAGE_MAX } from '@/components/estimate/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { ArrowUpRight, BellRing, Clock, FileCheck, Lock } from 'lucide-react';

type MoreStepProps = EstimateStepProps & {
    processing: boolean;
    advisor: SharedData['seo']['advisor'];
};

/** Step 5 — free text + consent, the honeypot, the desktop submit button and the trust line (advisor who handles it). */
export default function MoreStep({ data, setData, errors, complete, processing, advisor }: MoreStepProps) {
    const { t } = useTranslation();

    return (
        <fieldset aria-labelledby="step-more" className="flex flex-col gap-6 pt-10">
            <StepHeading number={5} id="step-more" complete={complete}>
                {t('estimate.step_more')}
            </StepHeading>
            <FormField id="message" label={t('estimate.message')} error={errors.message}>
                {(aria) => (
                    <div className="relative">
                        <Textarea
                            {...aria}
                            name="message"
                            maxLength={MESSAGE_MAX}
                            placeholder={t('estimate.message_placeholder')}
                            value={data.message}
                            onChange={(e) => setData('message', e.target.value)}
                            className="min-h-32 pb-8"
                        />
                        <span aria-hidden className="text-muted-foreground pointer-events-none absolute right-3 bottom-2 text-xs tabular-nums">
                            {data.message.length}/{MESSAGE_MAX}
                        </span>
                    </div>
                )}
            </FormField>

            <div className="flex flex-col gap-2">
                <div className="flex items-start gap-3">
                    <Checkbox
                        id="consent"
                        name="consent"
                        checked={data.consent}
                        onCheckedChange={(checked) => setData('consent', checked === true)}
                        aria-required
                        aria-invalid={Boolean(errors.consent)}
                        aria-describedby={errors.consent ? 'consent-error' : undefined}
                        className="mt-0.5"
                    />
                    <Label htmlFor="consent" className="text-base/6 font-normal sm:text-sm/5">
                        {t('estimate.consent')}
                    </Label>
                </div>
                {errors.consent && (
                    <p id="consent-error" className="text-destructive text-sm">
                        {errors.consent}
                    </p>
                )}
            </div>

            {/* Honeypot: invisible to people, filled by bots, rejected server-side */}
            <div aria-hidden className="hidden">
                <label htmlFor="website">Website</label>
                <input
                    id="website"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={data.website}
                    onChange={(e) => setData('website', e.target.value)}
                />
            </div>

            <div className="flex flex-col items-center gap-5 pt-2">
                <Button type="submit" size="lg" disabled={processing} className="hidden w-full lg:inline-flex">
                    {processing ? t('estimate.submitting') : t('estimate.submit')}
                    <ArrowUpRight aria-hidden />
                </Button>
                {/* Trust line: three micro-mentions, then the advisor who will handle the request */}
                <ul role="list" className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
                    {[
                        { icon: Lock, label: t('estimate.trust_confidential') },
                        { icon: FileCheck, label: t('estimate.trust_free') },
                        { icon: Clock, label: t('estimate.trust_delay') },
                    ].map(({ icon: Icon, label }) => (
                        <li key={label} className="flex items-center gap-1.5">
                            <Icon aria-hidden className="size-3.5 shrink-0" />
                            {label}
                        </li>
                    ))}
                </ul>
                {advisor ? (
                    <p className="text-muted-foreground flex items-center gap-2 text-center text-sm">
                        <Avatar aria-hidden className="border-border size-6 border">
                            <AvatarImage src={advisor.photo} alt="" loading="lazy" />
                            <AvatarFallback className="bg-background-10 text-foreground text-xs font-medium">
                                {advisor.name
                                    .split(' ')
                                    .map((w) => w[0])
                                    .join('')}
                            </AvatarFallback>
                        </Avatar>
                        {t('estimate.handled_by', { name: advisor.name })}
                    </p>
                ) : (
                    <p className="text-muted-foreground flex items-center gap-2 text-center text-sm">
                        <BellRing aria-hidden className="size-3.5 shrink-0" />
                        {t('estimate.response_time')}
                    </p>
                )}
            </div>
        </fieldset>
    );
}
