import * as ws from './ws';
import { createSignal } from 'solid-js';
import { Howl } from 'howler';
import { makePersisted } from '@solid-primitives/storage';
import { isServer } from 'solid-js/web';
import { Api } from './api';
import { createStore, produce } from 'solid-js/store';
import { PartialBy, PartialUpdateSession } from './types';
import { createListener } from './util';

export type TrackListenerCallback = (
    track: Api.Track,
    position: number,
) => void;

interface PlayerState {
    playing: boolean;
    currentPlaybackSession: Api.PlaybackSession | undefined;
    playbackSessions: Api.PlaybackSession[];
}

export const [playerState, setPlayerState] = createStore<PlayerState>({
    playing: false,
    currentPlaybackSession: undefined,
    playbackSessions: [],
});

export const [currentPlaybackSessionId, setCurrentPlaybackSessionId] =
    makePersisted(
        createSignal<number | undefined>(undefined, { equals: false }),
        {
            name: `player.v1.currentPlaybackSessionId`,
        },
    );

export const [sound, setSound] = createSignal<Howl>();
export const [_playing, _setPlaying] = createSignal(false, { equals: false });
const onPlayingChangedListener =
    createListener<
        (
            value: ReturnType<typeof _playing>,
            old: ReturnType<typeof _playing>,
        ) => boolean | void
    >();
export const onPlayingChanged = onPlayingChangedListener.on;
export const offPlayingChanged = onPlayingChangedListener.off;
export const playing = _playing;
export const setPlaying = (value: Parameters<typeof _setPlaying>[0]) => {
    const old = _playing();
    if (typeof value === 'function') {
        value = value(old);
    }
    _setPlaying(value);
    onPlayingChangedListener.trigger(value, old);
};

export const [_volume, _setVolume] = makePersisted(
    createSignal(100, { equals: false }),
    {
        name: `player.v1.volume`,
    },
);
const onVolumeChangedListener =
    createListener<
        (
            value: ReturnType<typeof _volume>,
            old: ReturnType<typeof _volume>,
        ) => boolean | void
    >();
export const onVolumeChanged = onVolumeChangedListener.on;
export const offVolumeChanged = onVolumeChangedListener.off;
export const volume = _volume;
export const setVolume = (value: Parameters<typeof _setVolume>[0]) => {
    const old = _volume();
    if (typeof value === 'function') {
        value = value(old);
    }
    _setVolume(value);
    if (value !== old) {
        onVolumeChangedListener.trigger(value, old);
    }
};

export const [_currentSeek, _setCurrentSeek] = makePersisted(
    createSignal<number | undefined>(undefined, { equals: false }),
    {
        name: `player.v1.currentSeek`,
    },
);
const onCurrentSeekChangedListener =
    createListener<
        (
            value: ReturnType<typeof _currentSeek>,
            old: ReturnType<typeof _currentSeek>,
        ) => boolean | void
    >();
export const onCurrentSeekChanged = onCurrentSeekChangedListener.on;
export const offCurrentSeekChanged = onCurrentSeekChangedListener.off;
export const currentSeek = _currentSeek;
export const setCurrentSeek = (
    value: Parameters<typeof _setCurrentSeek>[0],
) => {
    const old = _currentSeek();
    if (typeof value === 'function') {
        value = value(old);
    }
    _setCurrentSeek(value);
    if (value !== old) {
        onCurrentSeekChangedListener.trigger(value, old);
    }
};

export const [currentTrackLength, setCurrentTrackLength] = makePersisted(
    createSignal<number>(0, { equals: false }),
    {
        name: `player.v1.currentTrackLength`,
    },
);
export const [currentAlbum, setCurrentAlbum] = makePersisted(
    createSignal<Api.Album | Api.Track | undefined>(undefined, {
        equals: false,
    }),
    {
        name: `player.v2.currentAlbum`,
    },
);
export const [currentTrack, setCurrentTrack] = makePersisted(
    createSignal<Api.Track | undefined>(undefined, { equals: false }),
    {
        name: `player.v2.currentTrack`,
    },
);

export const [_playlistPosition, _setPlaylistPosition] = makePersisted(
    createSignal<number | undefined>(undefined, { equals: false }),
    { name: `player.v1.playlistPosition` },
);
const onPlaylistPositionChangedListener =
    createListener<
        (
            value: ReturnType<typeof _playlistPosition>,
            old: ReturnType<typeof _playlistPosition>,
        ) => boolean | void
    >();
export const onPlaylistPositionChanged = onPlaylistPositionChangedListener.on;
export const offPlaylistPositionChanged = onPlaylistPositionChangedListener.off;
export const playlistPosition = _playlistPosition;
export const setPlaylistPosition = (
    value: Parameters<typeof _setPlaylistPosition>[0],
) => {
    const old = _playlistPosition();
    if (typeof value === 'function') {
        value = value(old);
    }
    _setPlaylistPosition(value);
    onPlaylistPositionChangedListener.trigger(value, old);
};

const [_playlist, _setPlaylist] = makePersisted(
    createSignal<Api.Track[]>([], { equals: false }),
    { name: `player.v1.playlist` },
);
const onPlaylistChangedListener =
    createListener<
        (
            value: ReturnType<typeof _playlist>,
            old: ReturnType<typeof _playlist>,
        ) => boolean | void
    >();
export const onPlaylistChanged = onPlaylistChangedListener.on;
export const offPlaylistChanged = onPlaylistChangedListener.off;
export const playlist = _playlist;
export const setPlaylist: typeof _setPlaylist = (
    value: Parameters<typeof _setPlaylist>[0],
) => {
    const old = _playlist();
    if (typeof value === 'function') {
        value = value(old);
    }
    _setPlaylist(value);
    onPlaylistChangedListener.trigger(value, old);
};

if (!isServer) {
    if (navigator?.mediaSession) {
        navigator.mediaSession.setActionHandler('play', () => play());
        navigator.mediaSession.setActionHandler('pause', () => pause());
        navigator.mediaSession.setActionHandler('stop', () => stop());
        navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
        navigator.mediaSession.setActionHandler('previoustrack', () =>
            previousTrack(),
        );
    }

    window.onbeforeunload = () => {
        if (playing()) {
            pause();
        }
    };

    if (import.meta.hot) {
        import.meta.hot.on('vite:beforeUpdate', () => {
            if (playing()) {
                pause();
            }
        });
    }

    document.body.onkeydown = function (e) {
        const target = e.target as HTMLElement;

        if (
            !(target instanceof HTMLInputElement) &&
            (e.key == ' ' || e.code == 'Space')
        ) {
            if (playerState.currentPlaybackSession?.playing || playing()) {
                pause();
            } else {
                play();
            }
            e.preventDefault();
        }
    };
}

export interface PlayerType {
    id: number;
    play(): boolean | void;
    playAlbum(album: Api.Album | Api.Track): Promise<boolean | void>;
    playPlaylist(tracks: Api.Track[]): boolean | void;
    playFromPlaylistPosition(index: number): boolean | void;
    addAlbumToQueue(album: Api.Album | Api.Track): Promise<void>;
    removeTrackFromPlaylist(index: number): void;
    pause(): void;
    stop(): void;
    seek(seek: number): void;
    previousTrack(): boolean;
    nextTrack(): boolean;
}

const playListener = createListener<() => void>();
export const onPlay = playListener.on;
export const offPlay = playListener.off;

export function isMasterPlayer(): boolean {
    return (
        playerState.currentPlaybackSession?.activePlayers.findIndex(
            (p) => p.playerId === player.id,
        ) === 0
    );
}

export function isPlayerActive(): boolean {
    return (
        playerState.currentPlaybackSession?.activePlayers.some(
            (p) => p.playerId === player.id,
        ) ?? false
    );
}

export function play() {
    if (isPlayerActive()) {
        if (player.play() === false) return;
    }
    playListener.trigger();
}

const seekListener = createListener<(seek: number, manual: boolean) => void>();
export const onSeek = seekListener.on;
export const offSeek = seekListener.off;

export function seek(seek: number, manual = false) {
    if (isPlayerActive()) {
        player.seek(seek);
    }
    seekListener.trigger(seek, manual);
}

const pauseListener = createListener<() => void>();
export const onPause = pauseListener.on;
export const offPause = pauseListener.off;

export function pause() {
    if (isPlayerActive()) {
        player.pause();
    }
    pauseListener.trigger();
}

const prevTrackListener = createListener<TrackListenerCallback>();
export const onPreviousTrack = prevTrackListener.on;
export const offPreviousTrack = prevTrackListener.off;

export function previousTrack(): boolean {
    if (player.previousTrack()) {
        prevTrackListener.trigger(currentTrack()!, playlistPosition()!);
        return true;
    }
    return false;
}

const nextTrackListener = createListener<TrackListenerCallback>();
export const onNextTrack = nextTrackListener.on;
export const offNextTrack = nextTrackListener.off;

export function nextTrack(): boolean {
    if (player.nextTrack()) {
        nextTrackListener.trigger(currentTrack()!, playlistPosition()!);
        return true;
    }
    return false;
}

const stopListener = createListener<() => void>();
export const onStop = stopListener.on;
export const offStop = stopListener.off;

export function stop() {
    if (isPlayerActive()) {
        player.stop();
    }
    stopListener.trigger();
}

const playAlbumListener = createListener<() => void>();
export const onPlayAlbum = playAlbumListener.on;
export const offPlayAlbum = playAlbumListener.off;

export async function playAlbum(album: Api.Album | Api.Track) {
    await player.playAlbum(album);
    playAlbumListener.trigger();
}

const playPlaylistListener = createListener<() => void>();
export const onPlayPlaylist = playPlaylistListener.on;
export const offPlayPlaylist = playPlaylistListener.off;

export function playPlaylist(tracks: Api.Track[]) {
    player.playPlaylist(tracks);
    playPlaylistListener.trigger();
}

const addAlbumToQueueListener = createListener<() => void>();
export const onAddAlbumToQueue = addAlbumToQueueListener.on;
export const offAddAlbumToQueue = addAlbumToQueueListener.off;

export async function addAlbumToQueue(album: Api.Album | Api.Track) {
    player.addAlbumToQueue(album);
    addAlbumToQueueListener.trigger();
}

const removeTrackFromPlaylistListener = createListener<() => void>();
export const onRemoveTrackFromPlaylist = removeTrackFromPlaylistListener.on;
export const offRemoveTrackFromPlaylist = removeTrackFromPlaylistListener.off;

export function removeTrackFromPlaylist(index: number) {
    player.removeTrackFromPlaylist(index);
    removeTrackFromPlaylistListener.trigger();
}

const playFromPlaylistPositionListener = createListener<() => void>();
export const onPlayFromPlaylistPosition = playFromPlaylistPositionListener.on;
export const offPlayFromPlaylistPosition = playFromPlaylistPositionListener.off;

export function playFromPlaylistPosition(index: number) {
    player.playFromPlaylistPosition(index);
    playFromPlaylistPositionListener.trigger();
}

export const player: PlayerType = {} as PlayerType;

function updateCurrentPlaybackSession(
    request: Omit<
        PartialBy<PartialUpdateSession, 'sessionId' | 'playlist'>,
        'playlist'
    > & {
        playlist?: PartialBy<Api.PlaybackSessionPlaylist, 'sessionPlaylistId'>;
    },
) {
    const session = playerState.currentPlaybackSession;
    if (session) {
        updatePlaybackSession(session.sessionId, request);
    }
}

function updatePlaybackSession(
    id: number,
    request: Omit<
        PartialBy<PartialUpdateSession, 'sessionId' | 'playlist'>,
        'playlist'
    > & {
        playlist?: PartialBy<Api.PlaybackSessionPlaylist, 'sessionPlaylistId'>;
    },
) {
    setPlayerState(
        produce((state) => {
            const current = state.currentPlaybackSession;
            const session =
                current?.sessionId === id
                    ? current
                    : state.playbackSessions.find((s) => s.sessionId === id);
            if (session) {
                request.sessionId = session.sessionId;
                const { playlist } = session;
                if (playlist && request.playlist) {
                    request.playlist.sessionPlaylistId =
                        playlist.sessionPlaylistId;
                }
                updateSessionPartial(state, request as PartialUpdateSession);
                ws.updateSession(request as PartialUpdateSession);
            }
        }),
    );
}

const onCurrentPlaybackSessionChangedListener =
    createListener<
        (
            value: PlayerState['currentPlaybackSession'],
            old: PlayerState['currentPlaybackSession'],
        ) => boolean | void
    >();
export const onCurrentPlaybackSessionChanged =
    onCurrentPlaybackSessionChangedListener.on;
export const offCurrentPlaybackSessionChanged =
    onCurrentPlaybackSessionChangedListener.off;

const onUpdateSessionPartialListener =
    createListener<(value: PartialUpdateSession) => boolean | void>();
export const onUpdateSessionPartial = onUpdateSessionPartialListener.on;
export const offUpdateSessionPartial = onUpdateSessionPartialListener.off;

export function updateSessionPartial(
    state: PlayerState,
    session: PartialUpdateSession,
) {
    state.playbackSessions.forEach((s) => {
        if (s.sessionId === session.sessionId) {
            Object.assign(s, session);
        }
    });

    if (state.currentPlaybackSession?.sessionId === session.sessionId) {
        Object.assign(state.currentPlaybackSession, session);

        if (state.currentPlaybackSession?.sessionId === session.sessionId) {
            if (isPlayerActive()) {
                if (
                    !state.currentPlaybackSession.activePlayers.some(
                        (p) => p.playerId === player.id,
                    )
                ) {
                    stop();
                }
            } else {
                if (typeof session.seek !== 'undefined') {
                    _setCurrentSeek(session.seek);
                }
            }

            if (typeof session.position !== 'undefined') {
                _setPlaylistPosition(session.position);
            }
            if (typeof session.playlist !== 'undefined') {
                _setPlaylist(session.playlist.tracks);
            }

            if (typeof playlistPosition() === 'number') {
                const track =
                    state.currentPlaybackSession.playlist.tracks[
                        playlistPosition()!
                    ];

                if (track) {
                    setCurrentTrack(track);
                    setCurrentTrackLength(Math.round(track.duration));
                }
            } else {
                setCurrentTrack(undefined);
                setCurrentTrackLength(0);
            }
        }
    }

    onUpdateSessionPartialListener.trigger(session);
}

export function updateSession(
    state: PlayerState,
    session: Api.PlaybackSession,
    setAsCurrent = false,
) {
    state.playbackSessions.forEach((s) => {
        if (s.sessionId === session.sessionId) {
            Object.assign(s, session);
        }
    });

    if (
        setAsCurrent ||
        session.sessionId === state.currentPlaybackSession?.sessionId
    ) {
        const old = state.currentPlaybackSession;
        state.currentPlaybackSession = session;
        setCurrentPlaybackSessionId(session.sessionId);

        console.debug('session changed to', session, 'from', old);

        _setPlaylist(session.playlist.tracks);
        _setCurrentSeek(session.seek);
        _setPlaylistPosition(
            session.playlist.tracks.length > 0 ? session.position : undefined,
        );

        if (typeof playlistPosition() === 'number') {
            const track = session.playlist.tracks[playlistPosition()!];

            if (track) {
                setCurrentTrack(track);
                setCurrentTrackLength(Math.round(track.duration));
            }
        } else {
            setCurrentTrack(undefined);
            setCurrentTrackLength(0);
        }

        onCurrentPlaybackSessionChangedListener.trigger(session, old);
    }
}

onPlay(() => {
    ws.playbackAction(ws.PlaybackAction.PLAY);
    updateCurrentPlaybackSession({
        playing: true,
    });
});

onPause(() => {
    ws.playbackAction(ws.PlaybackAction.PAUSE);
    updateCurrentPlaybackSession({
        playing: false,
    });
});

onStop(() => {
    ws.playbackAction(ws.PlaybackAction.STOP);
    updateCurrentPlaybackSession({
        playing: false,
    });
});

onNextTrack(() => {
    ws.playbackAction(ws.PlaybackAction.NEXT_TRACK);
    updateCurrentPlaybackSession({
        position: playlistPosition(),
    });
});

onPreviousTrack(() => {
    ws.playbackAction(ws.PlaybackAction.PREVIOUS_TRACK);
    updateCurrentPlaybackSession({
        position: playlistPosition(),
    });
});

onPlayPlaylist(() => {
    console.debug('playing playlist');
    updateCurrentPlaybackSession({
        position: playlistPosition(),
        playlist: { tracks: _playlist() },
    });
});

onAddAlbumToQueue(() => {
    console.debug('album added to queue');
    updateCurrentPlaybackSession({
        position: playlistPosition(),
        playlist: { tracks: _playlist() },
    });
});

onPlayAlbum(() => {
    console.debug('playing album', _playlist());
    updateCurrentPlaybackSession({
        position: playlistPosition(),
        playlist: { tracks: _playlist() },
    });
});

onPlaylistChanged((value, old) => {
    console.debug('playlist changed from', old, 'to', value);
});

onCurrentSeekChanged((value, old) => {
    console.debug('current seek changed from', old, 'to', value);
    if (isMasterPlayer()) {
        updateCurrentPlaybackSession({
            seek: value ?? 0,
        });
    }
});

onSeek((value, manual) => {
    if (manual) {
        updateCurrentPlaybackSession({
            seek: value ?? 0,
        });
        ws.setSeek(playerState.currentPlaybackSession!.sessionId, value ?? 0);
    }
});

onPlaylistPositionChanged((value, old) => {
    console.debug('playlist position changed from', old, 'to', value);
    if (isMasterPlayer()) {
        updateCurrentPlaybackSession({
            position: value ?? 0,
        });
    }
});
