import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useTranslation } from '@/hooks/use-translation';
import { linkClass } from '@/lib/hover-surface';
import { cn } from '@/lib/utils';
import { Link, useForm } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { type FormEvent, useId } from 'react';

const LENGTH = 6;

/**
 * The off-market gate (user decision 2026-09-29): a six-digit access code typed in the site's OTP field (one square
 * white cell per digit, digits only, paste-friendly, auto-submits on the sixth digit) posted to `off_market.unlock`;
 * a wrong code comes back as a field error, a right one reloads the page the visitor came from, now unlocked. Under it,
 * the way to get a code: the contact page.
 */
export default function OffMarketGate({ className }: { className?: string }) {
    const { t } = useTranslation();
    const id = useId();
    const { data, setData, post, processing, errors } = useForm<{ code: string }>({ code: '' });

    const send = () => post(route('off_market.unlock'), { preserveScroll: true });
    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        send();
    };

    return (
        <form onSubmit={submit} noValidate className={cn('flex flex-col gap-5', className)}>
            <div className="flex flex-col gap-2">
                <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium">
                    <LockKeyhole aria-hidden className="text-muted-foreground size-4" strokeWidth={1.5} />
                    {t('off_market.code_label')}
                </label>
                <InputOTP
                    id={id}
                    name="code"
                    maxLength={LENGTH}
                    pattern={REGEXP_ONLY_DIGITS}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    value={data.code}
                    onChange={(value) => setData('code', value)}
                    onComplete={send}
                    disabled={processing}
                    aria-invalid={errors.code ? true : undefined}
                    aria-describedby={cn(`${id}-hint`, errors.code && `${id}-error`)}
                >
                    <InputOTPGroup className="gap-2">
                        {Array.from({ length: LENGTH }, (_, i) => (
                            <InputOTPSlot
                                key={i}
                                index={i}
                                aria-label={t('off_market.code_digit', { n: i + 1, count: LENGTH })}
                                className="border-l"
                            />
                        ))}
                    </InputOTPGroup>
                </InputOTP>
                <p id={`${id}-hint`} className="text-muted-foreground text-xs">
                    {t('off_market.code_hint')}
                </p>
                {errors.code && (
                    <p id={`${id}-error`} role="alert" className="text-destructive text-xs text-pretty">
                        {errors.code}
                    </p>
                )}
            </div>
            <Button type="submit" size="lg" disabled={processing} className="w-full sm:w-fit">
                {processing ? t('off_market.unlocking') : t('off_market.unlock')}
                <ArrowUpRight aria-hidden />
            </Button>
            <p className="text-muted-foreground text-sm">
                <Link href={route('contact')} prefetch className={cn(linkClass, 'focus-ring text-foreground')}>
                    {t('off_market.request_code')}
                </Link>
            </p>
        </form>
    );
}
