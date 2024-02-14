import ArtistPage from '~/components/pages/artists/artist-page';
import ArtistsPage from '~/components/pages/artists/artists-page';

export default function artistPage(params: Record<string, string>) {
    return (
        <>
            {params.artistId ? (
                <ArtistPage artistId={parseInt(params.artistId!)} />
            ) : params.tidalArtistId ? (
                <ArtistPage tidalArtistId={parseInt(params.tidalArtistId!)} />
            ) : params.qobuzArtistId ? (
                <ArtistPage qobuzArtistId={parseInt(params.qobuzArtistId!)} />
            ) : (
                <ArtistsPage />
            )}
        </>
    );
}
