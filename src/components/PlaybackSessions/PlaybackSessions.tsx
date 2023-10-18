import './playback-sessions.css';
import { For, Index, createSignal } from 'solid-js';
import { Api } from '~/services/api';
import { playerState, setPlayerState, updateSession } from '~/services/player';
import Album from '../Album';
import * as ws from '~/services/ws';
import { produce } from 'solid-js/store';

const queuedTracksCache: {
    [id: number]: { position?: number; tracks: Api.Track[] };
} = {};

export default function playbackSessionsFunc() {
    const [sessions, setSessions] = createSignal<Api.PlaybackSession[]>(
        playerState.playbackSessions,
    );

    function deleteSession(sessionId: number) {
        if (sessionId === playerState.currentPlaybackSession?.id) {
            setPlayerState(
                produce((state) => {
                    state.currentPlaybackSession;
                    state.playbackSessions.find((s) => s.id === sessionId);
                    setSessions(sessions().filter((s) => s.id !== sessionId));
                    const newSession = sessions()[0];
                    if (newSession) {
                        updateSession(state, newSession, true);
                    }
                }),
            );
        }
        ws.deleteSession(sessionId);
    }

    function activateSession(session: Api.PlaybackSession) {
        if (session.id === playerState.currentPlaybackSession?.id) return;
        setPlayerState(
            produce((state) => {
                updateSession(state, session, true);
            }),
        );
    }

    function queuedTracks(session: Api.PlaybackSession) {
        const cache = queuedTracksCache[session.id];

        if (
            cache?.position === session.position &&
            cache?.tracks.every(
                (t, i) => session.playlist.tracks[i]?.trackId === t.trackId,
            )
        ) {
            return cache.tracks;
        }

        const tracks = session.playlist.tracks.slice(
            session.position ?? 0,
            session.playlist.tracks.length,
        );
        queuedTracksCache[session.id] = { position: session.position, tracks };

        return tracks;
    }

    return (
        <div class="playback-sessions">
            <div class="playback-sessions-list">
                <For each={playerState.playbackSessions}>
                    {(session) => (
                        <div
                            class={`playback-sessions-list-session${
                                playerState.currentPlaybackSession?.id ===
                                session.id
                                    ? ' active'
                                    : ''
                            }`}
                        >
                            <div
                                class="playback-sessions-list-session-header"
                                onClick={() => activateSession(session)}
                            >
                                <img
                                    class="playback-sessions-list-session-header-speaker-icon"
                                    src="/img/speaker-white.svg"
                                />
                                <h2 class="playback-sessions-list-session-header-session-name">
                                    {session.name}
                                </h2>
                                <h3 class="playback-sessions-list-session-header-session-tracks-queued">
                                    {queuedTracks(session).length} track
                                    {queuedTracks(session).length === 1
                                        ? ''
                                        : 's'}{' '}
                                    queued
                                </h3>
                                {playerState.currentPlaybackSession?.id ===
                                    session.id && (
                                    <>
                                        <img
                                            class="playback-sessions-list-session-header-checkmark-icon"
                                            src="/img/checkmark-white.svg"
                                        />
                                    </>
                                )}
                                {session.playing && (
                                    <img
                                        class="playback-sessions-list-session-header-playing-icon"
                                        src="/img/audio-white.svg"
                                    />
                                )}
                                <div
                                    class="playback-sessions-list-session-header-delete-session"
                                    onClick={(e) => {
                                        deleteSession(session.id);
                                        e.stopImmediatePropagation();
                                    }}
                                >
                                    <img
                                        class="cross-icon"
                                        src="/img/cross-white.svg"
                                        alt="Close playlist sessions modal"
                                    />
                                </div>
                            </div>
                            <div class="playback-sessions-playlist-tracks-container">
                                <div class="playback-sessions-playlist-tracks">
                                    <Index each={queuedTracks(session)}>
                                        {(track, index) =>
                                            index >= 4 ? (
                                                <></>
                                            ) : (
                                                <div class="playback-sessions-playlist-tracks-track">
                                                    <div class="playback-sessions-playlist-tracks-track-album-artwork">
                                                        <div class="playback-sessions-playlist-tracks-track-album-artwork-icon">
                                                            <Album
                                                                album={track()}
                                                                size={40}
                                                                route={false}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div class="playback-sessions-playlist-tracks-track-details">
                                                        <div class="playback-sessions-playlist-tracks-track-details-title">
                                                            {track().title}
                                                        </div>
                                                        <div class="playback-sessions-playlist-tracks-track-details-artist">
                                                            {track().artist}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }
                                    </Index>
                                </div>
                                {queuedTracks(session).length >= 3 && (
                                    <div class="playback-sessions-playlist-tracks-overlay"></div>
                                )}
                            </div>
                        </div>
                    )}
                </For>
            </div>
        </div>
    );
}
