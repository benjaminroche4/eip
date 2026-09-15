import { type BlogSection } from '@/components/blog/types';

export type TocEntry = { id: string; title: string };

/** Table-of-contents entries: every titled top-level section (quick answer, wysiwyg, FAQ) — CTA and tables are skipped. */
export function blogToc(sections: BlogSection[], faqFallback: string): TocEntry[] {
    return sections.flatMap((s) => {
        if (s._type === 'faqBlock') return s.items?.length ? [{ id: s._key, title: s.title || faqFallback }] : [];
        if ((s._type === 'quickAnswerBlock' || s._type === 'wysiwygBlock') && s.title) return [{ id: s._key, title: s.title }];
        return [];
    });
}
