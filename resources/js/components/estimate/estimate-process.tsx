import PageEyebrow from '@/components/page/page-eyebrow';
import { useTranslation } from '@/hooks/use-translation';

const STEPS = ['describe', 'analyse', 'receive'] as const;

/**
 * « Comment se déroule une estimation ? » (GEO, user decision 2026-09-22): a question h2 with an answer-first intro,
 * then the three steps with their delay (5 minutes, 24 working hours, confidential) numbered with the sand Montserrat
 * figure of the About values — the only indexable content of the page besides the intro.
 */
export default function EstimateProcess() {
    const { t } = useTranslation();

    return (
        <section aria-labelledby="estimate-process-title" className="mx-auto flex w-full max-w-5xl flex-col gap-10">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
                <PageEyebrow>{t('estimate.process_eyebrow')}</PageEyebrow>
                <h2 id="estimate-process-title" className="text-2xl font-medium tracking-tight text-balance sm:text-3xl">
                    {t('estimate.process_title')}
                </h2>
                {/* GEO: a self-contained sentence (brand + what + where + delay) */}
                <p className="text-muted-foreground max-w-2xl text-base/7 text-pretty sm:text-sm/6">{t('estimate.process_intro')}</p>
            </div>
            <ol className="grid gap-8 sm:grid-cols-3 sm:gap-6">
                {STEPS.map((key, i) => (
                    <li key={key} className="flex flex-col gap-3">
                        <span aria-hidden className="font-heading text-secondary-50 text-4xl font-semibold tabular-nums">
                            {String(i + 1).padStart(2, '0')}
                        </span>
                        <h3 className="text-lg font-medium">{t(`estimate.process_${key}_title`)}</h3>
                        <p className="text-muted-foreground text-base/7 text-pretty sm:text-sm/6">{t(`estimate.process_${key}_text`)}</p>
                        <p className="text-text-heading text-xs font-medium tracking-wider uppercase">{t(`estimate.process_${key}_delay`)}</p>
                    </li>
                ))}
            </ol>
        </section>
    );
}
