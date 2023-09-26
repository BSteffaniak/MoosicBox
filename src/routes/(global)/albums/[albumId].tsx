import './album-page.css';
import { createSignal, For } from 'solid-js';
import { isServer } from 'solid-js/web';
import * as api from '~/services/api';
import { useParams } from 'solid-start';
import { A } from '@solidjs/router';
import Album from '~/components/Album';
import { toTime } from '~/services/formatting';
import { currentTrack, playAlbum, playPlaylist } from '~/services/player';

export default function albumPage() {
    const params = useParams();
    const [album, setAlbum] = createSignal<api.Album>();
    const [tracks, setTracks] = createSignal<api.Track[]>();

    (async () => {
        if (isServer) return;
        setAlbum(await api.getAlbum(parseInt(params.albumId)));
        setTracks(await api.getAlbumTracks(parseInt(params.albumId)));
    })();

    async function playAlbumFrom(track: api.Track) {
        const playlist = tracks()!.slice(tracks()!.indexOf(track));

        await playPlaylist(playlist);
    }

    function albumDuration(): number {
        let duration = 0;

        tracks()!.forEach((track) => (duration += track.duration));

        return duration;
    }

    return (
        <>
            <A href="#" onClick={() => history.back()}>
                Back
            </A>
            <div class="album-page-container">
                <div class="album-page">
                    <div class="album-page-header">
                        <div class="album-page-album-info">
                            <div class="album-page-album-info-artwork">
                                {album() && (
                                    <Album
                                        album={album()!}
                                        artist={false}
                                        title={false}
                                        size={300}
                                    />
                                )}
                            </div>
                            <div class="album-page-album-info-details">
                                <div class="album-page-album-info-details-album-title">
                                    {album()?.title}
                                </div>
                                <div class="album-page-album-info-details-album-artist">
                                    {album()?.artist}
                                </div>
                                <div class="album-page-album-info-details-tracks">
                                    {tracks() && (
                                        <>
                                            {tracks()?.length} tracks (
                                            {toTime(
                                                Math.round(albumDuration()),
                                            )}
                                            )
                                        </>
                                    )}
                                </div>
                                <div class="album-page-album-info-details-release-date">
                                    {album()?.dateReleased}
                                </div>
                            </div>
                        </div>
                        <div class="album-page-album-controls">
                            <div class="album-page-album-controls-playback">
                                <button
                                    class="album-page-album-controls-playback-play-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        playAlbum(album()!);
                                        return false;
                                    }}
                                >
                                    <img
                                        src="/img/play-button.svg"
                                        alt="Play"
                                    />{' '}
                                    Play
                                </button>
                            </div>
                            <div class="album-page-album-controls-options"></div>
                        </div>
                    </div>
                    <table class="album-page-tracks">
                        <thead>
                            <tr>
                                <th class="album-page-tracks-track-no-header">
                                    #
                                </th>
                                <th>Title</th>
                                <th>Artist</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tracks() && (
                                <For each={tracks()}>
                                    {(track) => (
                                        <tr
                                            class={`album-page-tracks-track${
                                                currentTrack()?.trackId ===
                                                track.trackId
                                                    ? ' playing'
                                                    : ''
                                            }`}
                                        >
                                            <td
                                                class="album-page-tracks-track-no"
                                                onClick={() =>
                                                    playAlbumFrom(track)
                                                }
                                            >
                                                <div class="album-page-tracks-track-no-container">
                                                    {currentTrack()?.trackId ===
                                                    track.trackId ? (
                                                        <img
                                                            class="audio-icon"
                                                            src="/img/audio-white.svg"
                                                            alt="Playing"
                                                        />
                                                    ) : (
                                                        <span class="track-no-text">
                                                            {track.number}
                                                        </span>
                                                    )}
                                                    <img
                                                        class="play-button"
                                                        src="/img/play-button-white.svg"
                                                        alt="Play"
                                                    />
                                                </div>
                                            </td>
                                            <td class="album-page-tracks-track-title">
                                                {track.title}
                                            </td>
                                            <td class="album-page-tracks-track-artist">
                                                {track.artist}
                                            </td>
                                            <td class="album-page-tracks-track-time">
                                                {toTime(
                                                    Math.round(track.duration),
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </For>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
