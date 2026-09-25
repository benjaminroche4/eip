import BackgroundVideo from '@/components/page/background-video';

/** Background clip of the home hero: the shared `BackgroundVideo` with the owner's clip and the hero photo as poster. */
export default function HeroVideo() {
    return <BackgroundVideo base="/videos/home/hero" poster="/images/home/hero-1200.jpg" />;
}
