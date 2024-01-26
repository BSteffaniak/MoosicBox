import './artist-page.css';
import { createEffect, createSignal, For, Show } from 'solid-js';
import { isServer } from 'solid-js/web';
import { A } from 'solid-start';
import Album from '~/components/Album';
import Artist from '~/components/Artist';
import { Api, api, Artist as ApiArtist } from '~/services/api';

export default function artistPage(props: {
    artistId?: number;
    tidalArtistId?: number;
    qobuzArtistId?: string;
}) {
    const [libraryArtist, setLibraryArtist] = createSignal<Api.Artist | null>();
    const [libraryAlbums, setLibraryAlbums] = createSignal<
        Api.Album[] | null
    >();
    const [tidalArtist, setTidalArtist] = createSignal<Api.TidalArtist>();
    const [tidalAlbums, setTidalAlbums] = createSignal<Api.TidalAlbum[]>();
    const [tidalEpsAndSingles, setTidalEpsAndSingles] =
        createSignal<Api.TidalAlbum[]>();
    const [tidalCompilations, setTidalCompilations] =
        createSignal<Api.TidalAlbum[]>();

    function getArtist(): ApiArtist | null | undefined {
        return libraryArtist() ?? tidalArtist();
    }

    async function loadTidalAlbums(tidalId: number) {
        await Promise.all([
            api.getAllTidalArtistAlbums(tidalId, setTidalAlbums, ['LP']),
            api.getAllTidalArtistAlbums(tidalId, setTidalEpsAndSingles, [
                'EPS_AND_SINGLES',
            ]),
            api.getAllTidalArtistAlbums(tidalId, setTidalCompilations, [
                'COMPILATIONS',
            ]),
        ]);
    }

    async function loadLibraryArtist(): Promise<Api.Artist | undefined> {
        if (props.artistId) {
            const artist = await api.getArtist(props.artistId);
            setLibraryArtist(artist);
            return artist;
        }
    }

    async function loadTidalArtist(
        tidalArtistId: number,
    ): Promise<Api.TidalArtist | undefined> {
        const tidalArtist = await api.getTidalArtist(tidalArtistId);
        setTidalArtist(tidalArtist);
        return tidalArtist;
    }

    async function loadArtist() {
        if (props.artistId) {
            const artist = await loadLibraryArtist();
            if (artist?.tidalId) {
                await loadTidalAlbums(artist.tidalId);
            }
        }
        if (props.tidalArtistId) {
            await Promise.all([
                loadLibraryArtist(),
                loadTidalArtist(props.tidalArtistId),
            ]);
        }
    }

    async function loadLibraryAlbums() {
        try {
            if (props.artistId) {
                const albums = await api.getArtistAlbums(props.artistId);
                setLibraryAlbums(albums);
            } else if (props.tidalArtistId) {
                const libraryAlbum =
                    await api.getLibraryAlbumsFromTidalArtistId(
                        props.tidalArtistId,
                    );
                setLibraryAlbums(libraryAlbum);
            }
        } catch {
            setLibraryAlbums(null);
        }
    }

    async function loadAlbums() {
        if (props.artistId) {
            await loadLibraryAlbums();
        }
        if (props.tidalArtistId) {
            await Promise.all([
                loadLibraryAlbums(),
                loadTidalAlbums(props.tidalArtistId),
            ]);
        }
    }

    createEffect(async () => {
        if (isServer) return;
        await Promise.all([loadArtist(), loadAlbums()]);
    });

    return (
        <>
            <div class="artist-page-container">
                <div class="artist-page">
                    <div class="artist-page-breadcrumbs">
                        <A
                            class="back-button"
                            href="#"
                            onClick={() => history.back()}
                        >
                            Back
                        </A>
                    </div>
                    <div class="artist-page-header">
                        <div class="artist-page-artist-info">
                            <div class="artist-page-artist-info-cover">
                                <Show when={getArtist()}>
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
                                <h1 class="artist-page-artist-info-details-artist-title">
                                    {getArtist()?.title}
                                </h1>
                            </div>
                        </div>
                    </div>
                    <Show when={(libraryAlbums()?.length ?? 0) > 0}>
                        <h1 class="artist-page-albums-header">
                            Albums in Library
                        </h1>
                        <div class="artist-page-albums">
                            <For each={libraryAlbums()}>
                                {(album) => (
                                    <Album
                                        album={album}
                                        artist={true}
                                        title={true}
                                        controls={true}
                                        versionQualities={true}
                                        size={200}
                                    />
                                )}
                            </For>
                        </div>
                    </Show>
                    <Show when={(tidalAlbums()?.length ?? 0) > 0}>
                        <h1 class="artist-page-albums-header">
                            Albums on Tidal
                        </h1>
                        <div class="artist-page-albums">
                            <For each={tidalAlbums()}>
                                {(album) => (
                                    <Album
                                        album={album}
                                        artist={true}
                                        title={true}
                                        controls={true}
                                        versionQualities={true}
                                        size={200}
                                    />
                                )}
                            </For>
                        </div>
                    </Show>
                    <Show when={(tidalEpsAndSingles()?.length ?? 0) > 0}>
                        <h1 class="artist-page-albums-header">
                            EPs and Singles on Tidal
                        </h1>
                        <div class="artist-page-albums">
                            <For each={tidalEpsAndSingles()}>
                                {(album) => (
                                    <Album
                                        album={album}
                                        artist={true}
                                        title={true}
                                        controls={true}
                                        versionQualities={true}
                                        size={200}
                                    />
                                )}
                            </For>
                        </div>
                    </Show>
                    <Show when={(tidalCompilations()?.length ?? 0) > 0}>
                        <h1 class="artist-page-albums-header">
                            Compilations on Tidal
                        </h1>
                        <div class="artist-page-albums">
                            <For each={tidalCompilations()}>
                                {(album) => (
                                    <Album
                                        album={album}
                                        artist={true}
                                        title={true}
                                        controls={true}
                                        versionQualities={true}
                                        size={200}
                                    />
                                )}
                            </For>
                        </div>
                    </Show>
                </div>
            </div>
        </>
    );
}
