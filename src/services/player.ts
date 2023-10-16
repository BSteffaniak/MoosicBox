import { createSignal } from 'solid-js';
import { Howl } from 'howler';
import { makePersisted } from '@solid-primitives/storage';
import { isServer } from 'solid-js/web';
import { Api } from './api';

export type TrackListenerCallback = (
    track: Api.Track,
    position: number,
) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BaseCallbackType = (...args: any) => any;
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
        listeners.forEach((callback) => callback(...args));
    };

    return { on, off, listeners, trigger: trigger as CallbackType };
}

export const [sound, setSound] = createSignal<Howl>();
export const [playing, setPlaying] = createSignal(false, { equals: false });
export const [currentSeek, setCurrentSeek] = makePersisted(
    createSignal<number | undefined>(undefined, { equals: false }),
    {
        name: `player.v1.currentSeek`,
    },
);
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
export const [playlistPosition, setPlaylistPosition] = makePersisted(
    createSignal<number>(0, { equals: false }),
    { name: `player.v1.playlistPosition` },
);
export const [playlist, setPlaylist] = makePersisted(
    createSignal<Api.Track[]>([], { equals: false }),
    { name: `player.v1.playlist` },
);

if (!isServer) {
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
