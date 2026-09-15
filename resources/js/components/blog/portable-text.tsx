import SeoImage from '@/components/seo/seo-image';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { youtubeId } from '@/lib/youtube';
import { ArrowUpRight, Info, Quote } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { type PortableNode, type Span, type TextBlock } from './types';
import YoutubeEmbed from './youtube-embed';

type PortableTextProps = { value: PortableNode[] };

/** Renders the Portable Text array of a wysiwyg / quick-answer section (paragraphs, headings, lists, links, images, videos). */
export default function PortableText({ value }: PortableTextProps) {
    return (
        <>
            {groupLists(value).map((item) => (Array.isArray(item) ? <List key={item[0]._key} items={item} /> : <Node key={item._key} node={item} />))}
        </>
    );
}

/** Consecutive `listItem` blocks become one <ul>/<ol> (Sanity stores each item as a flat block). */
function groupLists(nodes: PortableNode[]): (PortableNode | TextBlock[])[] {
    const out: (PortableNode | TextBlock[])[] = [];
    for (const node of nodes) {
        const last = out[out.length - 1];
        if (node._type === 'block' && node.listItem) {
            if (Array.isArray(last) && last[0].listItem === node.listItem) last.push(node);
            else out.push([node]);
        } else {
            out.push(node);
        }
    }
    return out;
}

/**
 * Lists in the site's tone rather than browser bullets: a small primary dot for bullets, a numbered sand disc for
 * ordered lists (CSS counter). A grey well was tried and removed (user decision). Markers are drawn with `before:` so the text stays selectable and aligned.
 */
function List({ items }: { items: TextBlock[] }) {
    const ordered = items[0].listItem === 'number';
    const Tag = ordered ? 'ol' : 'ul';
    return (
        <Tag role="list" className={cn('my-5 flex flex-col gap-2.5 text-base/7', ordered && '[counter-reset:item]')}>
            {items.map((b) => (
                <li
                    key={b._key}
                    className={cn(
                        'relative before:absolute before:left-0',
                        ordered
                            ? 'before:bg-background-08 before:text-foreground pl-9 before:top-0.5 before:flex before:size-6 before:items-center before:justify-center before:rounded-full before:text-xs before:font-medium before:tabular-nums before:content-[counter(item)] before:[counter-increment:item]'
                            : 'before:bg-primary pl-6 before:top-3 before:size-1.5 before:rounded-full',
                    )}
                >
                    <Spans block={b} />
                </li>
            ))}
        </Tag>
    );
}

function Node({ node }: { node: PortableNode }) {
    if (node._type === 'image') {
        if (!node.image) return null;
        const alt = node.alt ?? node.image.alt;
        return (
            <figure className="my-8">
                <SeoImage
                    src={node.image.url}
                    srcSet={node.image.srcset}
                    sizes="(min-width: 1024px) 46rem, 100vw"
                    width={node.image.width}
                    height={node.image.height}
                    alt={alt}
                    className="aspect-video w-full object-cover"
                />
                {/* Caption = the alt text, with an info icon on the left (user decision 2026-09-15). */}
                {alt && (
                    <figcaption className="text-muted-foreground mt-2 flex items-start gap-1.5 text-xs">
                        <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                        {alt}
                    </figcaption>
                )}
            </figure>
        );
    }

    if (node._type === 'youtube') {
        const id = youtubeId(node.url);
        if (!id) return null;
        return <YoutubeEmbed id={id} title={node.shortDescription ?? 'YouTube'} caption={node.shortDescription} />;
    }

    switch (node.style) {
        case 'h2':
            return (
                <h2 className="mt-14 mb-4 text-2xl font-medium tracking-tight">
                    <Spans block={node} />
                </h2>
            );
        case 'h3':
            return (
                <h3 className="mt-10 mb-3 text-xl font-medium">
                    <Spans block={node} />
                </h3>
            );
        case 'h4':
            return (
                <h4 className="mt-8 mb-2 text-lg font-medium">
                    <Spans block={node} />
                </h4>
            );
        case 'blockquote':
            return <PullQuote block={node} />;
        default:
            return (
                <p className="my-5 text-base/7">
                    <Spans block={node} />
                </p>
            );
    }
}

/**
 * Pull quote (user decision 2026-09-15, ui.sh variant « Double carte »): sand outer block (p-2) with an inner white
 * card, quotation mark on the left of the text — the same double-card pattern as the quick answer and the conclusion.
 */
function PullQuote({ block }: { block: TextBlock }) {
    return (
        <blockquote className="bg-background-08 my-8 p-2">
            <div className="bg-card flex gap-4 p-5 sm:p-6">
                <Quote aria-hidden className="text-secondary-50 mt-0.5 size-6 shrink-0 fill-current" />
                <p className="text-foreground text-base/7 text-pretty sm:text-sm/6">
                    <Spans block={block} />
                </p>
            </div>
        </blockquote>
    );
}

/** Inline children with their marks (strong / em / underline / link markDefs). */
function Spans({ block }: { block: TextBlock }) {
    const { t } = useTranslation();
    const defs = new Map((block.markDefs ?? []).map((d) => [d._key, d]));
    return (
        <>
            {block.children.map((span) => (
                <Fragment key={span._key}>{decorate(span, defs, t)}</Fragment>
            ))}
        </>
    );
}

function decorate(span: Span, defs: Map<string, { _type: string; href?: string }>, t: (key: string) => string): ReactNode {
    return (span.marks ?? []).reduce<ReactNode>((inner, mark) => {
        const def = defs.get(mark);
        if (def?._type === 'link' && def.href) {
            const external = /^https?:\/\//.test(def.href);
            return (
                <a
                    href={def.href}
                    className="focus-ring hover:text-primary underline underline-offset-4 transition-colors motion-reduce:transition-none"
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                >
                    {inner}
                    {external && (
                        <>
                            <ArrowUpRight aria-hidden className="ml-0.5 inline size-3 align-baseline" />
                            <span className="sr-only"> {t('blog.external_link')}</span>
                        </>
                    )}
                </a>
            );
        }
        if (mark === 'strong') return <strong>{inner}</strong>;
        if (mark === 'em') return <em>{inner}</em>;
        if (mark === 'underline') return <u>{inner}</u>;
        return inner;
    }, span.text);
}
