import './artist-page.css';
import { createSignal, For, Show } from 'solid-js';
import { isServer } from 'solid-js/web';
import { A, useParams } from 'solid-start';
import Album from '~/components/Album';
import Artist from '~/components/Artist';
import { Api, api } from '~/services/api';

export default function albumPage() {
    const params = useParams();
    const [artist, setArtist] = createSignal<Api.Artist>();
    const [albums, setAlbums] = createSignal<Api.Album[]>();

    (async () => {
        if (isServer) return;
        setArtist(await api.getArtist(parseInt(params.artistId)));
        setAlbums(await api.getArtistAlbums(parseInt(params.artistId)));
    })();

    return (
        <>
            <A href="#" onClick={() => history.back()}>
                Back
            </A>
            <div class="artist-page-container">
                <div class="artist-page">
                    <div class="artist-page-header">
                        <div class="artist-page-artist-info">
                            <div class="artist-page-artist-info-cover">
                                <Show when={artist()}>
                                    {(artist) => (
                                        <Artist
                                            artist={artist()}
                                            route={false}
                                            size={400}
                                        />
                                    )}
                                </Show>
                            </div>
                            <div class="artist-page-artist-info-details">
                                <div class="artist-page-artist-info-details-album-title">
                                    {artist()?.title}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="artist-page-albums">
                        <For each={albums()}>
                            {(album) => (
                                <Album
                                    album={album}
                                    artist={true}
                                    title={true}
                                    controls={true}
                                    size={200}
                                />
                            )}
                        </For>
                    </div>
                </div>
            </div>
        </>
    );
}
