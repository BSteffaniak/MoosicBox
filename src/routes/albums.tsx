import AlbumPage from '~/components/pages/albums/album-page';
import AlbumsPage from '~/components/pages/albums/albums-page';

export default function albumPage(params: Record<string, string>) {
    return (
        <>
            {params.albumId ? (
                <AlbumPage albumId={parseInt(params.albumId!)} />
            ) : params.tidalAlbumId ? (
                <AlbumPage tidalAlbumId={parseInt(params.tidalAlbumId!)} />
            ) : params.qobuzAlbumId ? (
                <AlbumPage qobuzAlbumId={params.qobuzAlbumId!} />
            ) : (
                <AlbumsPage />
            )}
        </>
    );
}
