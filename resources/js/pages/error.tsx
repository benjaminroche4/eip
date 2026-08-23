import SeoHead from '@/components/seo/seo-head';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { Link } from '@inertiajs/react';

export default function ErrorPage({ status }: { status: number }) {
    const { t } = useTranslation();
    const key = [403, 404, 500, 503].includes(status) ? status : 500;
    const title = t(`errors.${key}.title`);
    const description = t(`errors.${key}.description`);

    return (
        <>
            <SeoHead title={`${status} – ${title}`} description={description} noindex />
            <PublicLayout className="flex max-w-2xl flex-col items-center py-24 text-center">
                <p className="text-muted-foreground text-sm font-medium">Erreur {status}</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
                <p className="text-muted-foreground mt-4 text-base/7 sm:text-sm/6">{description}</p>
                <div className="mt-8 flex gap-3">
                    <Button asChild>
                        <Link href={route('home')}>{t('errors.back_home')}</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={route('search')}>{t('errors.search')}</Link>
                    </Button>
                </div>
            </PublicLayout>
        </>
    );
}
