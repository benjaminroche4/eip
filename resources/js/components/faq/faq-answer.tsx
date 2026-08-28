import { parseFaqMarkup } from '@/lib/faq-markup';
import { linkClass } from '@/lib/hover-surface';
import { Link } from '@inertiajs/react';

type FaqAnswerProps = { text: string };

/** Answer body: plain text with `[label](route)` mentions rendered as prefetching links (drawn-underline hover). */
export default function FaqAnswer({ text }: FaqAnswerProps) {
    return (
        <>
            {parseFaqMarkup(text).map((segment, index) =>
                segment.type === 'link' ? (
                    <Link key={index} href={route(segment.route)} prefetch className={linkClass}>
                        {segment.value}
                    </Link>
                ) : (
                    <span key={index}>{segment.value}</span>
                ),
            )}
        </>
    );
}
