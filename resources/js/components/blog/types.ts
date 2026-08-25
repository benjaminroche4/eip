/** Mirrors `BlogPostSummary::toArray()` / `BlogPost::toArray()` (app/Domain/Blog/Data) and the raw Sanity block shapes. */

export type BlogImage = { url: string; srcset: string; width: number; height: number; alt: string };

export type BlogPostSummary = {
    id: string;
    title: string;
    slug: string;
    url: string;
    excerpt: string;
    read_time: number | null;
    published_at: string;
    updated_at: string;
    image: BlogImage | null;
    category: { name: string; slug: string } | null;
    authors: { name: string; slug: string }[];
};

export type BlogFaq = { question: string; answer: string };

export type BlogPost = BlogPostSummary & {
    body: BlogSection[];
    faqs: BlogFaq[];
    seo_title: string;
    seo_description: string;
    tags: string[];
};

/* Portable Text (inside quickAnswerBlock / wysiwygBlock) */

export type Span = { _key: string; _type: 'span'; text: string; marks?: string[] };

export type MarkDef = { _key: string; _type: string; href?: string };

export type TextBlock = {
    _key: string;
    _type: 'block';
    style?: 'normal' | 'h2' | 'h3' | 'h4' | 'blockquote';
    listItem?: 'bullet' | 'number';
    level?: number;
    children: Span[];
    markDefs?: MarkDef[];
};

export type ImageNode = { _key: string; _type: 'image'; alt?: string; image: BlogImage | null };

export type YoutubeNode = { _key: string; _type: 'youtube'; url: string; shortDescription?: string };

export type PortableNode = TextBlock | ImageNode | YoutubeNode;

/* Top-level sections of `blog.body` */

export type QuickAnswerSection = { _key: string; _type: 'quickAnswerBlock'; title?: string; content: PortableNode[] };

export type WysiwygSection = { _key: string; _type: 'wysiwygBlock'; title?: string; background?: boolean; content: PortableNode[] };

export type TableSection = {
    _key: string;
    _type: 'tableBlock';
    caption?: string;
    firstRowIsHeader?: boolean;
    firstColumnIsHeader?: boolean;
    table?: { rows: { _key: string; cells: string[] }[] };
};

export type CtaSection = { _key: string; _type: 'ctaBlock'; title?: string; description?: string; btnText?: string };

export type FaqSection = { _key: string; _type: 'faqBlock'; title?: string; items: ({ _key: string } & BlogFaq)[] };

export type BlogSection = QuickAnswerSection | WysiwygSection | TableSection | CtaSection | FaqSection;
