import { type Property } from '@/components/properties/property-card';
import { usePropertyFacts } from '@/components/properties/property-facts';
import { useTranslation } from '@/hooks/use-translation';

type PropertyHeaderProps = {
    property: Property;
    /** « Achat · Paris 7e · Champ-de-Mars ». */
    eyebrow: string;
    /** The GEO answer sentence. */
    answer: string;
};

/**
 * Header of the detail page, ui.sh variant « Tuiles à icône » chosen among 15 (user decision 2026-09-29): eyebrow, h1,
 * the answer-first sentence (the publication date and the reference left the header, user decisions 2026-09-29 / 30:
 * the reference now sits in the notices), then « En bref » as a
 * grid of facts, each with its thin icon in a square sand tile, the value over the label (a `dl`, the h2 sr-only).
 */
export default function PropertyHeader({ property, eyebrow, answer }: PropertyHeaderProps) {
    const { t } = useTranslation();
    const facts = usePropertyFacts(property);

    return (
        <>
            <header className="flex flex-col gap-4">
                <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{eyebrow}</p>
                <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{property.title}</h1>
                <p className="text-muted-foreground text-base/7 text-pretty sm:text-sm/6">{answer}</p>
            </header>
            <section aria-labelledby="property-facts">
                <h2 id="property-facts" className="sr-only">
                    {t('property.facts_title')}
                </h2>
                <dl className="grid grid-cols-3 gap-x-2 gap-y-4 sm:gap-4">
                    {facts.map((f) => (
                        // A `dl` group holds only dt / dd (axe `definition-list`): the tile and the label live in the dt, laid out
                        // on a two-row grid: the label over the value (user decision 2026-09-29) with the icon on the left
                        <div key={f.key} className="grid grid-cols-[2rem_1fr] grid-rows-2 items-center gap-x-2 sm:grid-cols-[2.5rem_1fr] sm:gap-x-3">
                            <dt className="contents">
                                <span
                                    aria-hidden
                                    className="bg-background-05 col-start-1 row-span-2 flex size-8 items-center justify-center sm:size-10"
                                >
                                    <f.icon className="size-4" strokeWidth={1.5} />
                                </span>
                                <span className="text-muted-foreground col-start-2 row-start-1 truncate text-[0.6875rem] sm:text-xs">{f.label}</span>
                            </dt>
                            <dd className="col-start-2 row-start-2 truncate text-xs font-medium tabular-nums sm:text-sm">{f.value}</dd>
                        </div>
                    ))}
                </dl>
            </section>
        </>
    );
}
