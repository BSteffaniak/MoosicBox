import './playback-sessions.css';
import { For, createEffect, createSignal, on } from 'solid-js';
import { Api } from '~/services/api';
import {
    currentPlaybackSession,
    playbackSessions,
    setCurrentPlaybackSession,
} from '~/services/player';
import Album from '../Album';
import * as ws from '~/services/ws';

export default function playbackSessionsFunc() {
    const [sessions, setSessions] = createSignal<Api.PlaybackSession[]>([], {
        equals: false,
    });

    createEffect(
        on(
            () => playbackSessions(),
            (value) => {
                setSessions(value);
            },
        ),
    );

    function deleteSession(sessionId: number) {
        ws.deleteSession(sessionId);
        setSessions(sessions().filter((s) => s.id !== sessionId));
    }

    function activateSession(session: Api.PlaybackSession) {
        if (session.id === currentPlaybackSession()?.id) return;
        setCurrentPlaybackSession(session);
    }

    return (
        <div class="playback-sessions">
            <div class="playback-sessions-list">
                <For each={sessions()}>
                    {(session) => (
                        <div
                            class={`playback-sessions-list-session${
                                currentPlaybackSession()?.id === session.id
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
                                    {session.playlist.tracks.length -
                                        (session.position ?? 0)}{' '}
                                    tracks queued
                                </h3>
                                {currentPlaybackSession()?.id ===
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
                                    <For each={session.playlist.tracks}>
                                        {(track, index) =>
                                            index() < (session.position ?? 0) ||
                                            index() - (session.position ?? 0) >=
                                                4 ? (
                                                <></>
                                            ) : (
                                                <div class="playback-sessions-playlist-tracks-track">
                                                    <div class="playback-sessions-playlist-tracks-track-album-artwork">
                                                        <div class="playback-sessions-playlist-tracks-track-album-artwork-icon">
                                                            <Album
                                                                album={track}
                                                                size={40}
                                                                route={false}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div class="playback-sessions-playlist-tracks-track-details">
                                                        <div class="playback-sessions-playlist-tracks-track-details-title">
                                                            {track.title}
                                                        </div>
                                                        <div class="playback-sessions-playlist-tracks-track-details-artist">
                                                            {track.artist}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }
                                    </For>
                                </div>
                                {session.playlist.tracks.length -
                                    (session.position ?? 0) >=
                                    3 && (
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
