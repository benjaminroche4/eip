import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useTranslation } from '@/hooks/use-translation';
import { linkClass } from '@/lib/hover-surface';
import { cn } from '@/lib/utils';
import { Link, useForm } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useId, useRef } from 'react';

const LENGTH = 4;

/**
 * The off-market gate (user decision 2026-09-29): the listing's four-digit access code (Sanity `accessCode`, 2026-10-14) typed in the site's OTP field (one square
 * white cell per digit, digits only, paste-friendly, **submitted by itself on the fourth digit**, the button only serves
 * Enter / a paste) posted to `off_market.unlock`; a wrong code comes back as a field error under the cells, which are
 * emptied for a new try; a right one reloads the page the visitor came from, now unlocked. Under it, the way to get a
 * code: the contact page.
 */
type OffMarketGateProps = {
    className?: string;
    /** Slug of the listing behind the gate (its own code is tried); null on the selection page (every listing's). */ property?: string | null;
};

export default function OffMarketGate({ className, property = null }: OffMarketGateProps) {
    const { t } = useTranslation();
    const id = useId();
    const { data, setData, post, processing, errors } = useForm<{ code: string; property: string | null }>({ code: '', property });

    const sent = useRef('');
    // Posted from an effect, never from the field's `onComplete`: that callback fires in the same tick as `onChange`,
    // when `data.code` still holds the previous digits (the server then answered « 4 chiffres », user report 2026-10-14).
    const send = useCallback(
        () =>
            post(route('off_market.unlock'), {
                preserveScroll: true,
                // A wrong code empties the cells and puts the cursor back: the visitor retypes at once (the same code included), the error stays on screen
                onError: () => {
                    sent.current = '';
                    setData('code', '');
                },
            }),
        [post, setData],
    );
    useEffect(() => {
        if (data.code.length === LENGTH && !processing && sent.current !== data.code) {
            sent.current = data.code;
            send();
        }
    }, [data.code, processing, send]);
    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Enter on the last digit: the effect already posted this code, never twice (review 2026-10-14)
        if (data.code.length === LENGTH && sent.current !== data.code) {
            sent.current = data.code;
            send();
        }
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
                    disabled={processing}
                    aria-invalid={errors.code ? true : undefined}
                    aria-describedby={cn(`${id}-hint`, errors.code && `${id}-error`)}
                >
                    {/* The cells only mirror the real (labelled) input: decorative for assistive tech (axe `aria-prohibited-attr`, 2026-10-14) */}
                    <InputOTPGroup className="gap-2" aria-hidden>
                        {Array.from({ length: LENGTH }, (_, i) => (
                            <InputOTPSlot key={i} index={i} className="border-l" />
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
