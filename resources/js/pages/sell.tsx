import PageIntro from '@/components/page/page-intro';
import PublicLayout from '@/layouts/public-layout';

export default function Sell() {
    return (
        <PublicLayout className="max-w-3xl">
            <PageIntro page="sell" />
        </PublicLayout>
    );
}
