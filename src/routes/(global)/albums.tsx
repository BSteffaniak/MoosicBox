import { useSearchParams } from 'solid-start';
import AlbumPage from '~/pages/albums/album-page';
import AlbumsPage from '~/pages/albums/albums-page';

export default function albumPage() {
    const [search] = useSearchParams();

    return (
        <>
            {search.albumId ? (
                <AlbumPage albumId={parseInt(search.albumId!)} />
            ) : search.tidalAlbumId ? (
                <AlbumPage tidalAlbumId={parseInt(search.tidalAlbumId!)} />
            ) : search.qobuzAlbumId ? (
                <AlbumPage qobuzAlbumId={search.qobuzAlbumId!} />
            ) : (
                <AlbumsPage />
            )}
        </>
    );
}
