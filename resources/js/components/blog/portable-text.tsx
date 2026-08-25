import SeoImage from '@/components/seo/seo-image';
import { useTranslation } from '@/hooks/use-translation';
import { youtubeId } from '@/lib/youtube';
import { Fragment, type ReactNode } from 'react';
import { type PortableNode, type Span, type TextBlock } from './types';

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

function List({ items }: { items: TextBlock[] }) {
    const Tag = items[0].listItem === 'number' ? 'ol' : 'ul';
    return (
        <Tag className={Tag === 'ol' ? 'my-4 list-decimal space-y-2 pl-6' : 'my-4 list-disc space-y-2 pl-6'}>
            {items.map((b) => (
                <li key={b._key}>
                    <Spans block={b} />
                </li>
            ))}
        </Tag>
    );
}

function Node({ node }: { node: PortableNode }) {
    const { t } = useTranslation();

    if (node._type === 'image') {
        if (!node.image) return null;
        return (
            <figure className="my-8">
                <SeoImage
                    src={node.image.url}
                    srcSet={node.image.srcset}
                    sizes="(min-width: 768px) 48rem, 100vw"
                    width={node.image.width}
                    height={node.image.height}
                    alt={node.alt ?? node.image.alt}
                    className="h-auto w-full"
                />
            </figure>
        );
    }

    if (node._type === 'youtube') {
        const id = youtubeId(node.url);
        if (!id) return null;
        const title = node.shortDescription ?? 'YouTube';
        return (
            <figure className="my-8">
                <iframe
                    src={`https://www.youtube-nocookie.com/embed/${id}`}
                    title={t('blog.video', { title })}
                    className="aspect-video w-full"
                    loading="lazy"
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
                {node.shortDescription && <figcaption className="text-muted-foreground mt-2 text-sm">{node.shortDescription}</figcaption>}
            </figure>
        );
    }

    switch (node.style) {
        case 'h2':
            return (
                <h2 className="mt-10 mb-4 text-2xl font-medium">
                    <Spans block={node} />
                </h2>
            );
        case 'h3':
            return (
                <h3 className="mt-8 mb-3 text-xl font-medium">
                    <Spans block={node} />
                </h3>
            );
        case 'h4':
            return (
                <h4 className="mt-6 mb-2 text-lg font-medium">
                    <Spans block={node} />
                </h4>
            );
        case 'blockquote':
            return (
                <blockquote className="border-border my-6 border-l-2 pl-4 italic">
                    <Spans block={node} />
                </blockquote>
            );
        default:
            return (
                <p className="my-4 text-base/7">
                    <Spans block={node} />
                </p>
            );
    }
}

/** Inline children with their marks (strong / em / underline / link markDefs). */
function Spans({ block }: { block: TextBlock }) {
    const defs = new Map((block.markDefs ?? []).map((d) => [d._key, d]));
    return (
        <>
            {block.children.map((span) => (
                <Fragment key={span._key}>{decorate(span, defs)}</Fragment>
            ))}
        </>
    );
}

function decorate(span: Span, defs: Map<string, { _type: string; href?: string }>): ReactNode {
    return (span.marks ?? []).reduce<ReactNode>((inner, mark) => {
        const def = defs.get(mark);
        if (def?._type === 'link' && def.href) {
            const external = /^https?:\/\//.test(def.href);
            return (
                <a href={def.href} className="focus-ring underline underline-offset-4" rel={external ? 'noopener' : undefined}>
                    {inner}
                </a>
            );
        }
        if (mark === 'strong') return <strong>{inner}</strong>;
        if (mark === 'em') return <em>{inner}</em>;
        if (mark === 'underline') return <u>{inner}</u>;
        return inner;
    }, span.text);
}
