import PageIntro from '@/components/page/page-intro';
import PublicLayout from '@/layouts/public-layout';

export default function Buy() {
    return (
        <PublicLayout className="max-w-3xl">
            <PageIntro page="buy" />
        </PublicLayout>
    );
}
