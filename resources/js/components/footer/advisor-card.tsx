import GoogleReviews from '@/components/footer/google-reviews';
import SeoImage from '@/components/seo/seo-image';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

/** Discreet bordered card: advisor photo + name, short invitation, monochrome Google rating, outline CTA. */
export default function AdvisorCard() {
    const { seo } = usePage<SharedData>().props;
    const { t } = useTranslation();
    const { agent } = seo;

    return (
        <div className="border-border flex flex-col gap-4 rounded-lg border p-4">
            <div className="flex items-center gap-3">
                <SeoImage src={agent.photo} alt={agent.name} width={48} height={48} className="size-12 shrink-0 rounded-full object-cover" />
                <div className="flex min-w-0 flex-col">
                    <p className="font-heading text-foreground text-sm font-semibold">{agent.name}</p>
                    {agent.role && <p className="text-muted-foreground text-xs">{agent.role}</p>}
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <p className="text-foreground text-sm font-medium">{t('footer.cta_title')}</p>
                <p className="text-muted-foreground text-xs font-light">{t('footer.cta_text')}</p>
            </div>
            <GoogleReviews />
            <Button asChild variant="outline" size="sm" className="group/cta w-fit">
                <Link href="#">
                    {t('nav.contact')}
                    <ArrowRight aria-hidden className="transition-transform duration-300 group-hover/cta:translate-x-0.5" />
                </Link>
            </Button>
        </div>
    );
}
