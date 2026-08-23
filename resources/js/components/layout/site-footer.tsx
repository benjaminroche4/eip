import BrandWordmark from '@/components/footer/brand-wordmark';
import ContactList from '@/components/footer/contact-list';
import FooterColumn from '@/components/footer/footer-column';
import FooterNav from '@/components/footer/footer-nav';
import LegalBar from '@/components/footer/legal-bar';
import SocialLinks from '@/components/footer/social-links';
import LanguageSwitcher from '@/components/i18n/language-switcher';
import BrandLogo from '@/components/layout/brand-logo';
import { useNavItems } from '@/components/navigation/nav-items';
import { useTranslation } from '@/hooks/use-translation';
import { Link } from '@inertiajs/react';

const container = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-15';

/**
 * Site footer (Figma 261-5543, adapted to a short navigation): outlined wordmark across the top,
 * brand block + navigation + contact columns on a sand → cream gradient, legal bar.
 */
export default function SiteFooter({ year }: { year: number }) {
    const { t } = useTranslation();
    const items = useNavItems();

    return (
        <footer className="from-background-10 to-background-02 after:via-border relative overflow-hidden bg-gradient-to-b after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-gradient-to-r after:from-transparent after:to-transparent">
            <div className={`${container} pt-12 lg:pt-16`}>
                <BrandWordmark />
            </div>

            <div className={`${container} grid gap-12 pt-14 pb-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-15 lg:pt-20 lg:pb-20`}>
                <div className="flex flex-col gap-5 sm:col-span-2 lg:col-span-1">
                    <Link href={route('home')} aria-label="Homepage" className="focus-ring inline-flex w-fit rounded-sm">
                        <BrandLogo />
                    </Link>
                    <p className="text-muted-foreground max-w-xs text-sm font-light">
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
