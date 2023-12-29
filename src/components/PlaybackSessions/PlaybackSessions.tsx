import './playback-sessions.css';
import { For, Index, createComputed, createSignal } from 'solid-js';
import { Api } from '~/services/api';
import {
    containsPlayer,
    playerState,
    setActivePlayerId,
    setPlayerState,
    updateSession,
} from '~/services/player';
import Album from '../Album';
import * as ws from '~/services/ws';
import { produce } from 'solid-js/store';
import Modal from '../Modal/Modal';
import { appState } from '~/services/app';

const queuedTracksCache: {
    [id: number]: { position?: number; tracks: Api.Track[] };
} = {};

export default function playbackSessionsFunc() {
    const [sessions, setSessions] = createSignal<Api.PlaybackSession[]>(
        playerState.playbackSessions,
    );
    const [activePlayersSession, setActivePlayersSession] =
        createSignal<Api.PlaybackSession>();

    const [connections, setConnections] = createSignal<Api.Connection[]>([]);

    createComputed(() => {
        setSessions(playerState.playbackSessions);

        if (activePlayersSession()) {
            setActivePlayersSession(
                sessions().find(
                    (s) => s.sessionId === activePlayersSession()?.sessionId,
                ),
            );
        }

        const alive = appState.connections.filter((c) => c.alive);
        const dead = appState.connections.filter((c) => !c.alive);

        const aliveCurrent = alive.filter(
            (a) => a.connectionId == ws.connectionId(),
        );
        const aliveOthers = alive.filter(
            (a) => a.connectionId != ws.connectionId(),
        );

        setConnections([...aliveCurrent, ...aliveOthers, ...dead]);
    });

    function showActivePlayers(session: Api.PlaybackSession) {
        setActivePlayersSession(session);
    }

    function disableAudioPlayer(
        session: Api.PlaybackSession,
        player: Api.Player,
    ) {
        const newActivePlayers = session.activePlayers
            .filter((p) => p.playerId !== player.playerId)
            .map((p) => p.playerId);

        console.debug(
            'Setting active players for session',
            session.sessionId,
            'to',
            newActivePlayers,
        );

        ws.setActivePlayers(session.sessionId, newActivePlayers);
    }

    function enableAudioPlayer(
        session: Api.PlaybackSession,
        player: Api.Player,
    ) {
        const newActivePlayers = [
            ...session.activePlayers.filter(
                (p) => p.playerId !== player.playerId,
            ),
            player,
        ];

        console.debug(
            'Setting active players for session',
            session.sessionId,
            'to',
            newActivePlayers,
        );

        const localPlayer = newActivePlayers.find((p) =>
            containsPlayer(p.playerId),
        );

        if (localPlayer) {
            setActivePlayerId(localPlayer.playerId);
        }

        ws.setActivePlayers(
            session.sessionId,
            newActivePlayers.map((player) => player.playerId),
        );
    }

    function deleteSession(sessionId: number) {
        if (sessionId === playerState.currentPlaybackSession?.sessionId) {
            setPlayerState(
                produce((state) => {
                    state.currentPlaybackSession;
                    state.playbackSessions.find(
                        (s) => s.sessionId === sessionId,
                    );
                    setSessions(
                        sessions().filter((s) => s.sessionId !== sessionId),
                    );
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
        if (session.sessionId === playerState.currentPlaybackSession?.sessionId)
            return;
        setPlayerState(
            produce((state) => {
                updateSession(state, session, true);
            }),
        );
    }

    function queuedTracks(session: Api.PlaybackSession) {
        const cache = queuedTracksCache[session.sessionId];

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
        queuedTracksCache[session.sessionId] = {
            position: session.position,
            tracks,
        };

        return tracks;
    }

    return (
        <div class="playback-sessions">
            <div class="playback-sessions-list">
                <For each={playerState.playbackSessions}>
                    {(session) => (
                        <div
                            class={`playback-sessions-list-session${
                                playerState.currentPlaybackSession
                                    ?.sessionId === session.sessionId
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
                                {playerState.currentPlaybackSession
                                    ?.sessionId === session.sessionId && (
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
                                <div class="playback-sessions-list-session-header-right">
                                    <div
                                        class="playback-sessions-list-session-header-show-active-players"
                                        onClick={(e) => {
                                            showActivePlayers(session);
                                            e.stopImmediatePropagation();
                                        }}
                                    >
                                        <img
                                            class="audio-icon"
                                            src="/img/more-options-white.svg"
                                            alt="Show active players"
                                        />
                                    </div>
                                    <div
                                        class="playback-sessions-list-session-header-delete-session"
                                        onClick={(e) => {
                                            deleteSession(session.sessionId);
                                            e.stopImmediatePropagation();
                                        }}
                                    >
                                        <img
                                            class="trash-icon"
                                            src="/img/trash-white.svg"
                                            alt="Delete playback session"
                                        />
                                    </div>
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
            <Modal
                show={() => activePlayersSession()}
                onClose={() => setActivePlayersSession(undefined)}
            >
                {(activePlayersSession) => (
                    <div class="playback-session-active-players-modal-container">
                        <div class="playback-session-active-players-modal-header">
                            <h1>
                                {activePlayersSession.name} - Active Players
                            </h1>
                            <div
                                class="playback-session-active-players-modal-header-close"
                                onClick={(e) => {
                                    setActivePlayersSession(undefined);
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
                        <div class="playback-session-active-players-modal-content">
                            <Index each={connections()}>
                                {(connection) => (
                                    <div
                                        class={`playback-session-active-players-modal-connection${
                                            connection().alive
                                                ? ' alive'
                                                : ' dead'
                                        }`}
                                    >
                                        <Index each={connection().players}>
                                            {(player) => (
                                                <div
                                                    class={`playback-session-active-players-modal-connection-player${
                                                        activePlayersSession.activePlayers.some(
                                                            (p) =>
                                                                p.playerId ===
                                                                player()
                                                                    .playerId,
                                                        )
                                                            ? ' active'
                                                            : ''
                                                    }`}
                                                >
                                                    {connection().name} -{' '}
                                                    {player().name}{' '}
                                                    {activePlayersSession.activePlayers.some(
                                                        (p) =>
                                                            p.playerId ===
                                                            player().playerId,
                                                    ) ? (
                                                        <img
                                                            class="audio-icon"
                                                            src="/img/audio-white.svg"
                                                            alt="Player enabled"
                                                            onClick={() =>
                                                                disableAudioPlayer(
                                                                    activePlayersSession,
                                                                    player(),
                                                                )
                                                            }
                                                        />
                                                    ) : (
                                                        <img
                                                            class="audio-icon"
                                                            src="/img/audio-off-white.svg"
                                                            alt="Player disabled"
                                                            onClick={() =>
                                                                enableAudioPlayer(
                                                                    activePlayersSession,
                                                                    player(),
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </Index>
                                    </div>
                                )}
                            </Index>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
