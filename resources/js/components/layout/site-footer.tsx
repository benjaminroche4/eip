import BrandWordmark from '@/components/footer/brand-wordmark';
import ContactCard from '@/components/footer/contact-card';
import FooterColumn from '@/components/footer/footer-column';
import FooterNav from '@/components/footer/footer-nav';
import LegalBar from '@/components/footer/legal-bar';
import OpenBadge from '@/components/footer/open-badge';
import SocialLinks from '@/components/footer/social-links';
import LanguageSwitcher from '@/components/i18n/language-switcher';
import BrandLogo from '@/components/layout/brand-logo';
import { useContactHref, useFooterNavItems } from '@/components/navigation/nav-items';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { Link } from '@inertiajs/react';

const container = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-15';

/**
 * Site footer (Figma 261-5543, adapted to a short navigation): outlined wordmark across the top,
 * brand block + navigation + contact columns on a sand → cream gradient, legal bar.
 */
export default function SiteFooter({ year }: { year: number }) {
    const { t } = useTranslation();
    const contactHref = useContactHref();
    const items = useFooterNavItems();

    return (
        <footer className="from-background-10 to-background-02 after:via-border relative overflow-hidden bg-gradient-to-b after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-gradient-to-r after:from-transparent after:to-transparent">
            <div className={`${container} pt-12 lg:pt-16`}>
                <BrandWordmark />
            </div>

            <div className={`${container} grid gap-12 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-15 lg:py-16`}>
                <div className="flex flex-col items-center gap-5 text-center sm:col-span-2 sm:items-start sm:text-left lg:col-span-1">
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
                <FooterColumn title={t('footer.navigation')} className="order-last sm:order-none">
                    <FooterNav items={items} label={t('footer.navigation')} />
                </FooterColumn>
                <FooterColumn title={t('footer.contact')} badge={<OpenBadge />}>
                    <ContactCard />
                    <span aria-hidden className="via-border block h-px w-full bg-gradient-to-r from-transparent to-transparent" />
                    <Button asChild variant="outline" size="lg" className="hover:bg-background-05 w-full bg-transparent dark:bg-transparent">
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
