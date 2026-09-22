import YoutubeEmbed from '@/components/blog/youtube-embed';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

describe('YoutubeEmbed', () => {
    it('shows a poster with a play button and only loads the iframe on click', async () => {
        const user = userEvent.setup();
        const { container } = renderPage(<YoutubeEmbed id="abc123" title="Visite guidée" caption="Visite guidée" />);

        expect(container.querySelector('iframe')).toBeNull(); // nothing from YouTube before the click
        const play = screen.getByRole('button', { name: 'Lire la vidéo : Visite guidée' });
        expect(container.querySelector('img')).toHaveAttribute('src', 'https://i.ytimg.com/vi/abc123/hqdefault.jpg');
        expect(container.querySelector('figcaption svg')).not.toBeNull(); // Info icon before the caption, as on the body images
        expect(container.querySelector('figcaption')).toHaveTextContent('Visite guidée');
        expect(await axe(container)).toHaveNoViolations();

        await user.click(play);
        const iframe = container.querySelector('iframe')!;
        expect(iframe).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/abc123?autoplay=1');
        expect(iframe).toHaveAttribute('title', 'Vidéo : Visite guidée');
        expect(screen.queryByRole('button')).toBeNull();
    });
});
