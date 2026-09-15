import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { type CtaSection } from './types';

type BlogCtaProps = { section: CtaSection };

/**
 * In-article call to action (user decision 2026-09-15, ui.sh variant « Centré »): sand-hairline card, everything
 * centred — advisor's photo, eyebrow, title, text and a primary button to the contact page.
 */
export default function BlogCta({ section }: BlogCtaProps) {
    const { t } = useTranslation();
    const { seo } = usePage<SharedData>().props;
    const advisor = seo.advisor;

    return (
        <aside className="border-secondary-30 bg-card my-8 border p-2" aria-label={section.title || t('blog.cta_default')}>
            <div className="from-background-05 flex flex-col items-center gap-5 bg-linear-to-b to-transparent p-6 text-center sm:p-8">
                {advisor && (
                    <Avatar aria-hidden className="border-border size-16 shrink-0 border">
                        <AvatarImage src={advisor.photo} alt="" loading="lazy" />
                        <AvatarFallback className="bg-background-10 text-foreground text-sm font-medium">
                            {advisor.name
                                .split(' ')
                                .map((w) => w[0])
                                .join('')}
                        </AvatarFallback>
                    </Avatar>
                )}
                <div className="flex max-w-lg flex-col items-center gap-1">
                    <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{t('blog.cta_eyebrow')}</p>
                    {section.title && <p className="text-xl font-medium tracking-tight text-balance">{section.title}</p>}
                    {section.description && <p className="text-muted-foreground text-base/7 text-balance sm:text-sm/6">{section.description}</p>}
                </div>
                <Button asChild size="lg" className="shrink-0">
                    <Link href={route('contact')} prefetch>
                        {section.btnText || t('blog.cta_default')}
                        <ArrowRight aria-hidden />
                    </Link>
                </Button>
            </div>
        </aside>
    );
}
