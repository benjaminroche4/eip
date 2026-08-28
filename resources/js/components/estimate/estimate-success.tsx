import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { Link } from '@inertiajs/react';
import { ArrowLeft, CircleCheckBig } from 'lucide-react';
import { useEffect, useRef } from 'react';

type EstimateSuccessProps = { message: string };

/** Confirmation shown in place of the valuation form once sent: check badge, title, the flash message, back home. */
export default function EstimateSuccess({ message }: EstimateSuccessProps) {
    const { t } = useTranslation();
    const title = useRef<HTMLHeadingElement>(null);

    // Move focus to the confirmation so keyboard / screen-reader users land on it after the redirect.
    useEffect(() => title.current?.focus({ preventScroll: true }), []);

    return (
        <div
            role="status"
            className="border-secondary-30 bg-card mx-auto flex max-w-2xl flex-col items-center gap-8 border p-8 text-center shadow-lg shadow-black/5 sm:p-12"
        >
            <div className="flex flex-col items-center gap-4 sm:gap-6">
                <span className="bg-background-05 flex size-13 items-center justify-center rounded-full sm:size-16">
                    <CircleCheckBig aria-hidden className="text-success size-7 sm:size-9" strokeWidth={1.5} />
                </span>
                <div className="flex flex-col gap-3">
                    <h2 ref={title} tabIndex={-1} className="text-2xl font-medium tracking-tight text-balance focus:outline-none">
                        {t('estimate.success_title')}
                    </h2>
                    <p className="text-muted-foreground mx-auto max-w-md text-base/7 text-pretty sm:text-sm/6">{message}</p>
                </div>
            </div>
            <Button asChild size="lg">
                <Link href={route('home')} prefetch>
                    <ArrowLeft aria-hidden />
                    {t('contact.back_home')}
                </Link>
            </Button>
        </div>
    );
}
