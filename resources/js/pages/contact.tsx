import ContactDetails from '@/components/contact/contact-details';
import ContactForm from '@/components/contact/contact-form';
import PageEyebrow from '@/components/page/page-eyebrow';
import SeoHead from '@/components/seo/seo-head';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { breadcrumbList, contactPage } from '@/lib/json-ld';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

type ContactProps = { topics: string[] };

/** Contact page (Figma 261-7354 desktop / 131-5711 mobile): intro + details on the left, consultation form on the right. */
export default function Contact({ topics }: ContactProps) {
    const { t } = useTranslation();
    const { ziggy, seo } = usePage<SharedData>().props;
    const origin = new URL(ziggy.location).origin;
    const crumbs = [
        { name: t('nav.home'), url: route('home') },
        { name: t('pages.contact.title'), url: route('contact') },
    ];

    return (
        <>
            <SeoHead
                title={t('pages.contact.seo_title')}
                description={t('pages.contact.seo_description')}
                jsonLd={[contactPage(seo, origin, route('contact'), t('pages.contact.seo_title')), breadcrumbList(crumbs, origin)]}
            />
            <PublicLayout>
                {/* Mobile: intro → form → details. Desktop: intro + details in the left column, form spanning both rows on the right. */}
                <div className="grid gap-10 lg:grid-cols-5 lg:grid-rows-[auto_1fr] lg:gap-x-20 lg:gap-y-12 lg:px-10">
                    <div className="flex flex-col gap-4 text-center lg:col-span-2 lg:text-left">
                        <PageEyebrow>{t('nav.contact_page')}</PageEyebrow>
                        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t('contact.headline')}</h1>
                        <p className="text-muted-foreground text-base/7 text-pretty sm:text-sm/6">{t('pages.contact.intro')}</p>
                    </div>
                    <div className="lg:col-span-3 lg:col-start-3 lg:row-span-2 lg:row-start-1">
                        <ContactForm topics={topics} />
                    </div>
                    <div className="lg:col-span-2 lg:col-start-1 lg:row-start-2">
                        <ContactDetails />
                    </div>
                </div>
            </PublicLayout>
        </>
    );
}
