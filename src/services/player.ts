import { createSignal } from 'solid-js';
import { Howl } from 'howler';
import { makePersisted } from '@solid-primitives/storage';
import { isServer } from 'solid-js/web';
import { Api } from './api';

export type TrackListenerCallback = (
    track: Api.Track,
    position: number,
) => void;

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

export function play() {
    player.play();
}

export function seek(seek: number) {
    player.seek(seek);
}

export function pause() {
    player.pause();
}

let previousTrackListeners: TrackListenerCallback[] = [];
export function onPreviousTrack(
    callback: TrackListenerCallback,
): TrackListenerCallback {
    previousTrackListeners.push(callback);
    return callback;
}
export function offPreviousTrack(callback: TrackListenerCallback): void {
    previousTrackListeners = previousTrackListeners.filter(
        (c) => c !== callback,
    );
}

export function previousTrack(): boolean {
    if (player.previousTrack()) {
        previousTrackListeners.forEach((callback) =>
            callback(currentTrack()!, playlistPosition()!),
        );
        return true;
    }
    return false;
}

let nextTrackListeners: TrackListenerCallback[] = [];
export function onNextTrack(
    callback: TrackListenerCallback,
): TrackListenerCallback {
    nextTrackListeners.push(callback);
    return callback;
}
export function offNextTrack(callback: TrackListenerCallback): void {
    nextTrackListeners = nextTrackListeners.filter((c) => c !== callback);
}

export function nextTrack(): boolean {
    if (player.nextTrack()) {
        nextTrackListeners.forEach((callback) =>
            callback(currentTrack()!, playlistPosition()!),
        );
        return true;
    }
    return false;
}

export function stop() {
    player.stop();
}

export async function playAlbum(album: Api.Album | Api.Track) {
    await player.playAlbum(album);
}

export function playPlaylist(tracks: Api.Track[]) {
    player.playPlaylist(tracks);
}

export async function addAlbumToQueue(album: Api.Album | Api.Track) {
    player.addAlbumToQueue(album);
}

export function removeTrackFromPlaylist(index: number) {
    player.removeTrackFromPlaylist(index);
}

export function playFromPlaylistPosition(index: number) {
    player.playFromPlaylistPosition(index);
}

export const player: PlayerType = {} as PlayerType;
