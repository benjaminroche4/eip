import BrandWordmark from '@/components/footer/brand-wordmark';
import ContactCard from '@/components/footer/contact-card';
import FooterColumn from '@/components/footer/footer-column';
import FooterNav from '@/components/footer/footer-nav';
import LegalBar from '@/components/footer/legal-bar';
import OpenBadge from '@/components/footer/open-badge';
import SocialLinks from '@/components/footer/social-links';
import LanguageSwitcher from '@/components/i18n/language-switcher';
import BrandLogo from '@/components/layout/brand-logo';
import GradientHairline from '@/components/layout/gradient-hairline';
import { useContactHref, useFooterAboutItems, useFooterNavItems } from '@/components/navigation/nav-items';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { Link } from '@inertiajs/react';

const container = 'mx-auto max-w-7xl px-6 lg:px-15';

/**
 * Site footer (Figma 261-5543, adapted to a short navigation): outlined wordmark across the top,
 * brand block + contact + navigation columns on a sand → cream gradient, legal bar.
 */
export default function SiteFooter({ year }: { year: number }) {
    const { t } = useTranslation();
    const contactHref = useContactHref();
    const items = useFooterNavItems();
    const aboutItems = useFooterAboutItems();

    return (
        <footer className="from-background-10 to-background-02 after:via-border relative overflow-hidden bg-gradient-to-b after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-gradient-to-r after:from-transparent after:to-transparent">
            <div className={`${container} pt-12 lg:pt-16`}>
                {/* Mobile / tablet: edge to edge (the column keeps its gutters), a touch more present than on desktop */}
                <BrandWordmark className="-mx-6 lg:mx-0" />
            </div>

            <div className={`${container} grid grid-cols-2 gap-12 py-12 lg:grid-cols-[1.4fr_0.7fr_0.7fr_1.3fr] lg:gap-15 lg:py-16`}>
                <div className="col-span-2 flex flex-col items-center gap-5 text-center sm:items-start sm:text-left lg:col-span-1">
                    <Link href={route('home')} aria-label="Homepage" className="focus-ring inline-flex w-fit rounded-none">
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
                {/* The two nav columns share a row at every width (user decision 2026-09-22); brand and contact take the full row below lg */}
                <FooterColumn title={t('footer.navigation')}>
                    <FooterNav items={items} label={t('footer.navigation')} />
                </FooterColumn>
                <FooterColumn title={t('footer.about_column')}>
                    <FooterNav items={aboutItems} label={t('footer.about_column')} />
                </FooterColumn>
                <FooterColumn title={t('footer.contact')} badge={<OpenBadge />} className="order-first col-span-2 lg:order-none lg:col-span-1">
                    <ContactCard />
                    <GradientHairline />
                    <Button asChild variant="outline" size="lg" className="bg-card w-full">
                        <Link href={contactHref} prefetch>
                            {t('nav.contact_page')}
                        </Link>
                    </Button>
                </FooterColumn>
            </div>

            <div className={container}>
                <LegalBar year={year} />
            </div>
        </footer>
    );
}
