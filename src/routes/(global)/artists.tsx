import { useSearchParams } from 'solid-start';
import ArtistPage from '~/pages/artists/artist-page';
import ArtistsPage from '~/pages/artists/artists-page';

export default function artistPage() {
    const [search] = useSearchParams();

    return (
        <>
            {search.artistId ? (
                <ArtistPage artistId={parseInt(search.artistId!)} />
            ) : search.tidalArtistId ? (
                <ArtistPage tidalArtistId={parseInt(search.tidalArtistId!)} />
            ) : search.qobuzArtistId ? (
                <ArtistPage qobuzArtistId={search.qobuzArtistId!} />
            ) : (
                <ArtistsPage />
            )}
        </>
    );
}
