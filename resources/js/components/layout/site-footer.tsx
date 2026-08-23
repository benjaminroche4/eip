import BrandWordmark from '@/components/footer/brand-wordmark';
import ContactList from '@/components/footer/contact-list';
import FooterColumn from '@/components/footer/footer-column';
import FooterNav from '@/components/footer/footer-nav';
import LegalBar from '@/components/footer/legal-bar';
import SocialLinks from '@/components/footer/social-links';
import LanguageSwitcher from '@/components/i18n/language-switcher';
import { useNavItems } from '@/components/navigation/nav-items';
import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

const container = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-15';

/**
 * Site footer (Figma 261-5543, adapted to a short navigation): outlined wordmark across the top,
 * brand block + navigation + contact columns on a sand → cream gradient, legal bar.
 */
export default function SiteFooter({ year }: { year: number }) {
    const { seo } = usePage<SharedData>().props;
    const { t } = useTranslation();
    const items = useNavItems();

    return (
        <footer className="from-background-10 to-background-02 overflow-hidden bg-gradient-to-b">
            <div className={`${container} pt-12`}>
                <BrandWordmark />
            </div>

            <div className={`${container} grid gap-10 pt-12 pb-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-15`}>
                <div className="flex flex-col gap-4 lg:col-span-2">
                    <Link href={route('home')} aria-label="Homepage" className="focus-ring inline-flex w-fit rounded-sm">
                        <img
                            src="/brand/logo-mark.svg"
                            alt={seo.siteName}
                            width={59}
                            height={36}
                            loading="lazy"
                            decoding="async"
                            className="h-7 w-auto"
                        />
                    </Link>
                    <p className="text-foreground max-w-xs text-sm">
                        {t('footer.tagline_1')}
                        <br />
                        {t('footer.tagline_2')}
                    </p>
                    <div className="flex items-center gap-4">
                        <SocialLinks />
                        <span aria-hidden className="bg-grey-30 h-5 w-px" />
                        <LanguageSwitcher />
                    </div>
                </div>
                <FooterColumn title={t('footer.navigation')}>
                    <FooterNav items={items} label={t('footer.navigation')} />
                </FooterColumn>
                <FooterColumn title={t('footer.contact')}>
                    <ContactList />
                </FooterColumn>
            </div>

            <div className={container}>
                <LegalBar year={year} />
            </div>
        </footer>
    );
}
