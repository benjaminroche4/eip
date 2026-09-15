import { useTranslation } from '@/hooks/use-translation';
import { Play } from 'lucide-react';
import { useState } from 'react';

type YoutubeEmbedProps = { id: string; title: string; caption?: string };

/**
 * Click-to-load YouTube facade (Core Web Vitals): the poster + a play button until the reader clicks,
 * then the privacy-enhanced iframe with autoplay. The poster is YouTube's own thumbnail for the video.
 */
export default function YoutubeEmbed({ id, title, caption }: YoutubeEmbedProps) {
    const { t } = useTranslation();
    const [playing, setPlaying] = useState(false);

    return (
        <figure className="my-8">
            {playing ? (
                <iframe
                    src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
                    title={t('blog.video', { title })}
                    className="aspect-video w-full"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            ) : (
                <button
                    type="button"
                    onClick={() => setPlaying(true)}
                    aria-label={t('blog.play_video', { title })}
                    className="group focus-ring bg-primary relative block aspect-video w-full overflow-hidden rounded-none"
                >
                    <img
                        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                        alt=""
                        loading="lazy"
                        width={480}
                        height={360}
                        className="size-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
                    />
                    <span
                        aria-hidden
                        className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30 motion-reduce:transition-none"
                    />
                    <span
                        aria-hidden
                        className="bg-background text-foreground absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
                    >
                        <Play className="ml-0.5 size-6 fill-current" />
                    </span>
                </button>
            )}
            {caption && <figcaption className="text-muted-foreground mt-2 text-xs">{caption}</figcaption>}
        </figure>
    );
}
