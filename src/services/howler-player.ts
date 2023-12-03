import { createSignal } from 'solid-js';
import { Howl, HowlCallback } from 'howler';
import { Api, api } from './api';
import {
    PlayerType,
    currentSeek,
    playing,
    playlist,
    playlistPosition,
    setCurrentAlbum,
    setCurrentSeek,
    setCurrentTrackLength,
    setPlaying,
    setPlaylist,
    setPlaylistPosition,
    play as playerPlay,
    stop as playerStop,
    onUpdateSessionPartial,
    volume,
    onVolumeChanged,
    isPlayerActive,
    setPlayerState,
    playbackQuality,
} from './player';

export type TrackListenerCallback = (
    track: Api.Track,
    position: number,
) => void;

export const [sound, setSound] = createSignal<Howl>();

let seekHandle: NodeJS.Timeout;
let endHandle: HowlCallback;
let loadHandle: HowlCallback;

function getTrackUrl(track: Api.Track): string {
    const query = new URLSearchParams({ trackId: track.trackId.toString() });

    const clientId = Api.clientId();
    const signatureToken = Api.signatureToken();

    if (clientId && signatureToken) {
        query.set('clientId', clientId);
        query.set('signature', signatureToken);
    }

    console.log(playbackQuality());
    if (playbackQuality().format !== Api.AudioFormat.SOURCE) {
        query.set('format', playbackQuality().format);
    }

    return `${Api.apiUrl()}/track?${query}`;
}

function refreshCurrentSeek() {
    const seek = sound()?.seek();
    if (typeof seek === 'number') {
        const roundedSeek = Math.round(seek);
        if (currentSeek() !== roundedSeek) {
            console.debug(`Setting currentSeek to ${roundedSeek}`);
            setCurrentSeek(roundedSeek);
        }
    }
}

function setTrack(): boolean {
    if (!sound()) {
        if (typeof playlistPosition() === 'undefined') {
            console.debug('No track to play');
            return false;
        }
        const track = playlist()![playlistPosition()!];
        console.debug('Setting track to', track);

        const howl = new Howl({
            src: [getTrackUrl(track)],
            format: 'flac',
            html5: true,
        });
        howl.volume(volume() / 100);
        howl.pannerAttr({ panningModel: 'equalpower' });
        setSound(howl);
        setPlayerState({ currentTrack: track });
        const duration = Math.round(track.duration);
        if (!isNaN(duration) && isFinite(duration)) {
            setCurrentTrackLength(duration);
        }
    }
    return true;
}

onVolumeChanged((value) => {
    sound()?.volume(value / 100);
});

onUpdateSessionPartial(() => {
    if (!isPlayerActive() && sound()) {
        console.debug('stopping howl');
        stopHowl();
    }
});

let ended: boolean = true;
let loaded = false;

function play(): boolean {
    if (playing()) {
        console.debug('Already playing');
        return false;
    }

    const initialSeek = !sound() ? currentSeek() : undefined;

    if (!sound() || ended) {
        if (!setTrack()) return false;

        sound()!.on(
            'end',
            (endHandle = (id: number) => {
                if (ended) {
                    console.debug(
                        'End called after track already ended',
                        id,
                        sound(),
                        sound()?.duration(),
                    );
                    return;
                }
                console.debug('Track ended', id, sound(), sound()?.duration());
                ended = true;
                loaded = false;
                nextTrack();
            }),
        );
        sound()!.on(
            'load',
            (loadHandle = (...args) => {
                ended = false;
                loaded = true;
                console.debug(
                    'Track loaded',
                    sound(),
                    sound()!.duration(),
                    ...args,
                );
                const duration = Math.round(sound()!.duration());
                if (!isNaN(duration) && isFinite(duration)) {
                    setCurrentTrackLength(duration);
                }
                if (typeof initialSeek === 'number') {
                    console.debug(`Setting initial seek to ${initialSeek}`);
                    sound()!.seek(initialSeek);
                }
            }),
        );
    }

    sound()!.play();

    seekHandle = setInterval(() => {
        if (!loaded) return;
        refreshCurrentSeek();
    }, 200);

    if (loaded && typeof initialSeek === 'number') {
        console.debug(`Setting initial seek to ${initialSeek}`);
        sound()!.seek(initialSeek);
    }

    setPlaying(true);
    console.debug('Playing', sound());

    return true;
}

function seek(seek: number) {
    console.debug('Track seeked');
    if (typeof seek === 'number') {
        console.debug(`Setting seek to ${seek}`);
        setCurrentSeek(seek);
        sound()?.seek(seek);
    }
}

function pause() {
    sound()?.pause();
    setPlaying(false);
    clearInterval(seekHandle);
    console.debug('Paused');
}

function previousTrack(): boolean {
    if ((currentSeek() ?? 0) < 5) {
        console.debug('Playing previous track');
        setPlaylistPosition((value) => (value! > 0 ? value! - 1 : value!));
        const shouldPlay = playing();
        stop();
        if (shouldPlay) play();
        else setTrack();
        return true;
    } else {
        console.debug('Setting track position to 0');
        seek(0);
        return false;
    }
}

function nextTrack(): boolean {
    if (
        typeof playlistPosition() === 'number' &&
        playlistPosition()! < playlist()!.length - 1
    ) {
        console.debug('Playing next track');
        setPlaylistPosition((value) => value! + 1);
        const shouldPlay = playing();
        stop();
        if (shouldPlay) play();
        else setTrack();
        return true;
    } else {
        console.debug('No next track to play');
        playerStop();
        return false;
    }
}

function stopHowl() {
    sound()?.off('end', endHandle);
    sound()?.off('load', loadHandle);
    if (!ended) {
        sound()?.stop();
    }
    loaded = false;
    sound()?.unload();
    setSound(undefined);
}

function stop() {
    stopHowl();
    setCurrentSeek(undefined);
    clearInterval(seekHandle);
    setPlayerState({ currentTrack: undefined });
    setCurrentTrackLength(0);
    setPlaying(false);
    console.debug('Track stopped');
}

async function playAlbum(album: Api.Album | Api.Track): Promise<boolean> {
    setCurrentAlbum(album);

    const tracks = await api.getAlbumTracks(album.albumId);

    setPlaylistPosition(0);
    setPlaylist(tracks);
    stop();
    return playerPlay()!;
}

function playPlaylist(tracks: Api.Track[]): boolean {
    const firstTrack = tracks[0];
    setCurrentAlbum(firstTrack);

    setPlaylistPosition(0);
    setPlaylist(tracks);
    stop();
    return playerPlay()!;
}

async function addAlbumToQueue(album: Api.Album | Api.Track) {
    const tracks = await api.getAlbumTracks(album.albumId);

    setPlaylist([...playlist()!, ...tracks]);
}

function removeTrackFromPlaylist(index: number) {
    console.debug('Removing track from playlist', index);
    if (index < playlistPosition()!) {
        setPlaylistPosition(playlistPosition()! - 1);
    }
    setPlaylist([...playlist()!.filter((_, i) => i !== index)]);
}

function playFromPlaylistPosition(index: number) {
    console.debug('Playing from playlist position', index);
    setPlaylistPosition(index);
    const shouldPlay = playing();
    stop();
    if (shouldPlay) play();
    else setTrack();
}

export function createPlayer(id: number): PlayerType {
    return {
        id,
        play,
        playAlbum,
        playPlaylist,
        playFromPlaylistPosition,
        addAlbumToQueue,
        removeTrackFromPlaylist,
        pause,
        stop,
        seek,
        previousTrack,
        nextTrack,
    };
}
