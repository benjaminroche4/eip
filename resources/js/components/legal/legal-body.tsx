import { Fragment, type ReactNode } from 'react';

type LegalBodyProps = { body: string };

/** « Libellé : valeur » (FR) or « Label: value » (EN) at the start of a line: a short label without a full stop, then a colon. */
const LABEL_LINE = /^([^.:\n]{2,40}?)\s?:\s(.+)$/;

/** A list item line: « - texte ». */
const LIST_LINE = /^- (.+)$/;

const textClass = 'text-muted-foreground wrap-break-word text-base/7 text-pretty sm:text-sm/6';

/** A line with its « Libellé : » highlighted in the heading colour, or the plain line. */
function Line({ line }: { line: string }): ReactNode {
    const match = LABEL_LINE.exec(line);
    if (!match) return line;
    return (
        <>
            <span className="text-text-heading font-medium">{match[1]}&nbsp;:</span> {match[2]}
        </>
    );
}

/**
 * Body of a legal section, written as plain text in `lang/{locale}/legal.php`: blocks separated by a blank line are
 * paragraphs (line breaks kept), except a block whose lines all start with « - », rendered as a list with the site's
 * dot (no browser bullet, like the blog lists). In both, every line shaped as « Libellé : valeur » gets its label in the
 * heading colour and medium weight so addresses, phone numbers and the GDPR items stand out (user decisions 2026-09-22).
 */
export default function LegalBody({ body }: LegalBodyProps) {
    const blocks = body.split(/\n\s*\n/);

    return (
        <div className="flex flex-col gap-4">
            {blocks.map((block, b) => {
                const lines = block.split('\n');
                if (lines.every((line) => LIST_LINE.test(line))) {
                    return (
                        <ul key={b} role="list" className={`${textClass} flex flex-col gap-2`}>
                            {lines.map((line, i) => (
                                <li
                                    key={i}
                                    className="before:bg-primary relative pl-5 before:absolute before:top-3 before:left-1 before:size-1.5 before:rounded-full sm:before:top-2.5"
                                >
                                    <Line line={LIST_LINE.exec(line)![1]} />
                                </li>
                            ))}
                        </ul>
                    );
                }
                return (
                    <p key={b} className={`${textClass} whitespace-pre-line`}>
                        {lines.map((line, i) => (
                            <Fragment key={i}>
                                {i > 0 && '\n'}
                                <Line line={line} />
                            </Fragment>
                        ))}
                    </p>
                );
            })}
        </div>
    );
}
