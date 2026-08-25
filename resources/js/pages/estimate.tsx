import PageIntro from '@/components/page/page-intro';
import PublicLayout from '@/layouts/public-layout';

export default function Estimate() {
    return (
        <PublicLayout className="max-w-3xl">
            <PageIntro page="estimate" />
        </PublicLayout>
    );
}
