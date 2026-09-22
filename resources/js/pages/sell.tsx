import PageIntro from '@/components/page/page-intro';
import SellGallery from '@/components/sell/sell-gallery';
import SellPhoto from '@/components/sell/sell-photo';
import PublicLayout from '@/layouts/public-layout';

/** « Vendre »: intro, then a wide photo section and a photo mosaic (2026-09-22); the rest of the page is still to come. */
type SellProps = { gallery: string[] };

export default function Sell({ gallery }: SellProps) {
    return (
        <PublicLayout className="flex max-w-7xl flex-col gap-12 sm:gap-16">
            <div className="max-w-3xl">
                <PageIntro page="sell" />
            </div>
            <SellPhoto />
            <SellGallery alts={gallery} />
        </PublicLayout>
    );
}
