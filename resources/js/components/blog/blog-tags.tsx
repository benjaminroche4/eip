import { useTranslation } from '@/hooks/use-translation';

type BlogTagsProps = { tags: string[] };

/** Article tags at the end of the body (user decision 2026-09-15, ui.sh variant « Contour carré »): square outlined chips, not links (no tag page). */
export default function BlogTags({ tags }: BlogTagsProps) {
    const { t } = useTranslation();
    if (tags.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <p className="text-muted-foreground mr-1 text-xs font-medium tracking-wider uppercase">{t('blog.tags')}</p>
            <ul role="list" className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                    <li key={tag} className="border-border text-foreground rounded-none border px-2.5 py-1 text-xs">
                        {tag}
                    </li>
                ))}
            </ul>
        </div>
    );
}
