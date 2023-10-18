import { createSignal } from 'solid-js';
import { Howl } from 'howler';
import { makePersisted } from '@solid-primitives/storage';
import { isServer } from 'solid-js/web';
import { Api } from './api';
import {
    PartialBy,
    PlaybackAction,
    PartialUpdateSession,
    playbackAction,
    updateSession,
} from './ws';
import { createStore, produce } from 'solid-js/store';

export type TrackListenerCallback = (
    track: Api.Track,
    position: number,
) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BaseCallbackType = (...args: any) => boolean | void;
function createListener<CallbackType extends BaseCallbackType>(): {
    on: (callback: CallbackType) => CallbackType;
    off: (callback: CallbackType) => void;
    listeners: CallbackType[];
    trigger: CallbackType;
} {
    let listeners: CallbackType[] = [];
    function on(callback: CallbackType): CallbackType {
        listeners.push(callback);
        return callback;
    }
    function off(callback: CallbackType): void {
        listeners = listeners.filter((c) => c !== callback);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trigger = (...args: any) => {
        for (const listener of listeners) {
            if (listener(...args) === false) {
                break;
            }
        }
    };

    return { on, off, listeners, trigger: trigger as CallbackType };
}

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

export const [_currentPlaybackSession, _setCurrentPlaybackSession] =
    createSignal<Api.PlaybackSession | undefined>(undefined, { equals: false });
const onCurrentPlaybackSessionChangedListener =
    createListener<
        (
            value: ReturnType<typeof _currentPlaybackSession>,
            old: ReturnType<typeof _currentPlaybackSession>,
        ) => boolean | void
    >();
export const onCurrentPlaybackSessionChanged =
    onCurrentPlaybackSessionChangedListener.on;
export const offCurrentPlaybackSessionChanged =
    onCurrentPlaybackSessionChangedListener.off;
export const currentPlaybackSession = _currentPlaybackSession;
export const setCurrentPlaybackSession = (
    value: Parameters<typeof _setCurrentPlaybackSession>[0],
) => {
    const old = _currentPlaybackSession();
    if (typeof value === 'function') {
        value = value(old);
    }
    _setCurrentPlaybackSession(value);
    onCurrentPlaybackSessionChangedListener.trigger(value, old);
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
    createSignal<number>(0, { equals: false }),
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
export const setPlaylistPosition: typeof _setPlaylistPosition = (
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
            if (playing()) {
                pause();
            } else {
                play();
            }
            e.preventDefault();
        }
    };
}

export interface PlayerType {
    play(): void;
    playAlbum(album: Api.Album | Api.Track): Promise<void>;
    playPlaylist(tracks: Api.Track[]): void;
    playFromPlaylistPosition(index: number): void;
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

export function play() {
    player.play();
    playListener.trigger();
}

const seekListener = createListener<() => void>();
export const onSeek = seekListener.on;
export const offSeek = seekListener.off;

export function seek(seek: number) {
    player.seek(seek);
    seekListener.trigger();
}

const pauseListener = createListener<() => void>();
export const onPause = pauseListener.on;
export const offPause = pauseListener.off;

export function pause() {
    player.pause();
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
    player.stop();
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
        PartialBy<PartialUpdateSession, 'id' | 'playlist'>,
        'playlist'
    > & { playlist?: PartialBy<Api.PlaybackSessionPlaylist, 'id'> },
) {
    const session = currentPlaybackSession();
    if (session) {
        updatePlaybackSession(session.id, request);
    }
}

function updatePlaybackSession(
    id: number,
    request: Omit<
        PartialBy<PartialUpdateSession, 'id' | 'playlist'>,
        'playlist'
    > & { playlist?: PartialBy<Api.PlaybackSessionPlaylist, 'id'> },
) {
    setPlayerState(
        produce((state) => {
            const current = state.currentPlaybackSession;
            const session =
                current?.id === id
                    ? current
                    : state.playbackSessions.find((s) => s.id === id);
            if (session) {
                Object.assign(session, request);
                const index = state.playbackSessions.findIndex(
                    (s) => s.id === session!.id,
                );
                if (index !== -1) {
                    state.playbackSessions[index] = session;
                }

                request.id = session.id;
                const { playlist } = session;
                if (playlist && request.playlist) {
                    request.playlist.id = playlist.id;
                }
                updateSession(request as PartialUpdateSession);
            }
        }),
    );
}

onCurrentPlaybackSessionChanged((value, old) => {
    console.debug('session changed to', value);

    if (old && playing()) {
        updatePlaybackSession(old.id, { playing: false });
    }
    if (value) {
        setPlaying(false);
        _setPlaylist(value.playlist.tracks);
        _setCurrentSeek(value.seek);
        _setPlaylistPosition(value.position ?? 0);
        if (typeof value.position === 'number') {
            const track = value.playlist.tracks[value.position];

            if (track) {
                setCurrentTrack(track);
                setCurrentTrackLength(Math.round(track.duration));
            }
        }
    }
});

onPlay(() => {
    playbackAction(PlaybackAction.PLAY);
    updateCurrentPlaybackSession({
        playing: true,
    });
});

onPause(() => {
    playbackAction(PlaybackAction.PAUSE);
    updateCurrentPlaybackSession({
        playing: false,
    });
});

onNextTrack(() => {
    playbackAction(PlaybackAction.NEXT_TRACK);
    updateCurrentPlaybackSession({
        position: playlistPosition(),
    });
});

onPreviousTrack(() => {
    playbackAction(PlaybackAction.PREVIOUS_TRACK);
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
    console.debug('playing album');
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
    updateCurrentPlaybackSession({
        seek: value,
    });
});

onPlaylistPositionChanged((value, old) => {
    console.debug('playlist position changed from', old, 'to', value);
});
