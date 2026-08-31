import ErrorCode from '@/components/error/error-code';
import PageEyebrow from '@/components/page/page-eyebrow';
import SeoHead from '@/components/seo/seo-head';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

/**
 * 403/404/500/503 page (Figma 708-15580): the status code as a giant dashed sand outline, the message
 * centred on top of it over a radial white glow, and a single "back to home" call to action.
 */
export default function ErrorPage({ status }: { status: number }) {
    const { t } = useTranslation();
    const key = [403, 404, 500, 503].includes(status) ? status : 500;
    const title = t(`errors.${key}.title`);
    const description = t(`errors.${key}.description`);

    return (
        <>
            <SeoHead title={`${status} - ${title}`} description={description} noindex />
            <PublicLayout className="flex flex-col justify-center">
                <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center py-8 sm:py-12">
                    {/* Full-width sand wash fading to white, like the Figma page background */}
                    <div
                        aria-hidden
                        className="from-background-05 to-background pointer-events-none absolute -top-32 left-1/2 -z-10 h-120 w-screen -translate-x-1/2 bg-gradient-to-b to-80%"
                    />
                    {/* Giant dashed code pinned behind the message, like the Figma background layer */}
                    <ErrorCode code={String(key)} className="absolute inset-x-0 top-1/2 -translate-y-1/2" />
                    <div className="from-background/90 via-background/40 relative flex max-w-xl flex-col items-center bg-radial from-25% via-60% to-transparent px-4 py-14 text-center sm:px-16">
                        <div className="flex flex-col items-center gap-4">
                            <PageEyebrow>{t('errors.label', { status: String(key) })}</PageEyebrow>
                            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
                            <p className="text-muted-foreground text-base/7 text-pretty sm:text-sm/6">{description}</p>
                        </div>
                        <Button asChild size="lg" className="mt-8">
                            <Link prefetch href={route('home')}>
                                <ArrowLeft aria-hidden />
                                {t('errors.back_home')}
                            </Link>
                        </Button>
                    </div>
                </div>
            </PublicLayout>
        </>
    );
}
