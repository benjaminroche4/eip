import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

type StepHeadingProps = { number: number; id: string; children: string; /** every required field of the step is filled */ complete?: boolean };

/** Numbered step title of the valuation form (Figma 696-13129): grey disc with the number, then the question — muted until the step is complete (same logic as the FAQ tabs). */
export default function StepHeading({ number, id, children, complete = false }: StepHeadingProps) {
    const { t } = useTranslation();

    return (
        <h2
            id={id}
            className={cn(
                'flex items-center gap-3 font-sans text-lg font-semibold transition-colors',
                complete ? 'text-foreground' : 'text-muted-foreground',
            )}
        >
            <span className="bg-grey-5 flex size-7 shrink-0 items-center justify-center rounded-full text-sm tabular-nums">
                <span className="sr-only">{t('estimate.step', { number })} </span>
                <span aria-hidden>{number}</span>
            </span>
            {children}
        </h2>
    );
}
