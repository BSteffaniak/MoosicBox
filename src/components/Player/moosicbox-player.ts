import * as player from '~/services/player';
import type { PlaybackUpdate } from '~/services/player';
import { type Track } from '~/services/api';
import { toTime } from '~/services/formatting';

const template = `
<div class="player">
    <div class="player-media-controls-seeker-bar">
        <div class="player-media-controls-seeker-bar-progress"></div>
        <div class="player-media-controls-seeker-bar-progress-trigger"></div>
        <div class="player-media-controls-seeker-bar-progress-tooltip"></div>
    </div>
    <div class="player-controls">
        <div class="player-now-playing">
            <div class="player-album-details">
                <div class="player-album-details-icon"></div>
                <div class="player-now-playing-details">
                    <div class="player-now-playing-details-title"></div>
                    <div class="player-now-playing-details-artist"></div>
                    <div class="player-now-playing-details-album"></div>
                </div>
            </div>
        </div>
        <div class="player-media-controls">
            <div class="player-media-controls-track">
                <button class="previous-track-button media-button button">
                    <img class="previous-track-button-icon" src="/img/next-button-white.svg" alt="Previous Track" />
                </button>
                <button class="pause-button media-button button">
                    <img class="pause-button-icon" src="/img/pause-button-white.svg" alt="Pause" />
                </button>
                <button class="play-button media-button button">
                    <img class="play-button-icon" src="/img/play-button-white.svg" alt="Play" />
                </button>
                <button class="next-track-button media-button button">
                    <img class="next-track-button-icon" src="/img/next-button-white.svg" alt="Next Track" />
                </button>
                <img class="show-playback-quality-icon" src="/img/more-options-white.svg" alt="Show Playback Quality" />
            </div>
            <div class="player-media-controls-seeker">
                <span class="player-media-controls-seeker-current-time"></span>
                //
                <span class="player-media-controls-seeker-total-time"></span>
            </div>
        </div>
        <div class="player-track-options">
            <div class="player-track-options-buttons">
                <moosicbox-player-volume></moosicbox-player-volume>
                <img class="show-playback-sessions-icon" src="/img/speaker-white.svg" alt="Show Playback Sessions" />
                <img class="show-playlist-icon" src="/img/playlist-white.svg" alt="Show Playlist" />
            </div>
            <div class="player-track-options-mobile">
                <img class="mobile-playback-options" src="/img/more-options-white.svg" alt="Show Playback Options" />
                <img class="show-playlist-icon" src="/img/playlist-white.svg" alt="Show Playlist" />
            </div>
        </div>
    </div>
    <div class="player-track-options-mobile-buttons">
        <moosicbox-player-volume></moosicbox-player-volume>
        <img class="show-playback-sessions-icon" src="/img/speaker-white.svg" alt="Show Playback Sessions" />
        <img class="show-playback-quality-icon" src="/img/more-options-white.svg" alt="Show Playback Quality" />
    </div>
    <div class="playlist-slideout">
        <div class="playlist-slideout-content">
            <moosicbox-player-playlist></moosicbox-player-playlist>
        </div>
        <div class="playlist-slideout-back-to-now-playing-top">
            Back to now playing
        </div>
        <div class="playlist-slideout-back-to-now-playing-bottom">
            Back to now playing
        </div>
    </div>
</div>
`;

class MoosicBoxHTMLElement extends HTMLElement {
    constructor() {
        super();
    }

    htmlElement<T extends HTMLElement>(query: string): T | undefined {
        return this.querySelector(query) as T | undefined;
    }

    htmlElements<T extends HTMLElement>(query: string): T[] {
        return [...this.querySelectorAll(query)] as T[];
    }
}

class MoosicboxPlayerVolume extends HTMLElement {
    constructor() {
        super();
    }
}

customElements.define('moosicbox-player-volume', MoosicboxPlayerVolume);

class MoosicboxPlayer extends MoosicBoxHTMLElement {
    playbackUpdatedListenerHandle: (
        update: Omit<PlaybackUpdate, 'sessionId'>,
    ) => void = (update) => this.handlePlaybackUpdate(update);
    seekUpdatedListenerHandle: (seek: number | undefined) => void = (seek) =>
        this.handlePlaybackUpdate({ seek });
    currentTrackLengthListenerHandle: (length: number | undefined) => void = (
        length,
    ) => this.handleCurrentTrackLengthUpdate(length);
    progressAnimationFrameHandle: (ts: number) => void = (ts) =>
        this.progressAnimationFrame(ts);

    playing = false;
    applyDrag = false;
    dragging = false;

    currentTrack?: Track | undefined;
    currentTrackLength?: number | undefined;
    seekPosition?: number | undefined;
    currentSeek?: number | undefined;

    private animationStart?: number | undefined;

    progressBar: HTMLDivElement;
    seekerCurrentTime: HTMLDivElement;
    seekerTotalTime: HTMLDivElement;

    constructor() {
        super();

        this.innerHTML = template;

        this.progressBar = this.htmlElement(
            '.player-media-controls-seeker-bar-progress',
        )!;
        this.seekerCurrentTime = this.htmlElement(
            '.player-media-controls-seeker-current-time',
        )!;
        this.seekerTotalTime = this.htmlElement(
            '.player-media-controls-seeker-total-time',
        )!;
    }

    private progressAnimationFrame(ts: number): void {
        if (!this.playing) {
            this.animationStart = undefined;

            return;
        }
        if (!this.animationStart) this.animationStart = ts;

        const elapsed = ts - this.animationStart;

        const duration = this.getCurrentTrackLength();

        if (
            typeof this.currentSeek !== 'undefined' &&
            typeof duration !== 'undefined'
        ) {
            const offset = (elapsed / 1000) * (1 / duration) * 100;

            this.progressBar.style.width = `${this.getProgressBarWidth() + offset}%`;
        }

        window.requestAnimationFrame(this.progressAnimationFrameHandle);
    }

    private setPlaying(playing: boolean) {
        this.playing = playing;

        this.htmlElements('.pause-button').forEach((e) => {
            e.style.display = playing ? 'initial' : 'none';
        });

        this.htmlElements('.play-button').forEach((e) => {
            e.style.display = playing ? 'none' : 'initial';
        });

        if (playing) {
            this.startAnimation();
        }
    }

    private startAnimation() {
        window.requestAnimationFrame((ts) => {
            this.animationStart = ts;
            window.requestAnimationFrame(this.progressAnimationFrameHandle);
        });
    }

    private updateSeekBar() {
        const duration = this.getCurrentTrackLength();

        if (typeof duration === 'undefined') return;

        this.progressBar.style.width = `${this.getProgressBarWidth()}%`;
    }

    private updateSeekerTimes() {
        this.seekerCurrentTime.innerHTML = toTime(this.currentSeek ?? 0);
        this.seekerTotalTime.innerHTML = toTime(
            this.getCurrentTrackLength() ?? 0,
        );
    }

    private getSeekPosition(): number {
        const duration = this.getCurrentTrackLength();

        if (typeof duration === 'undefined') return 0;

        return Math.max(Math.min(this.seekPosition ?? 0, duration), 0);
    }

    private getCurrentSeekPosition(): number {
        if (typeof this.currentSeek === 'undefined') return 0;

        const duration = this.getCurrentTrackLength();

        if (typeof duration === 'undefined') return 0;

        return Math.max(Math.min(this.currentSeek, duration), 0);
    }

    private getCurrentTrackLength(): number | undefined {
        return this.currentTrack?.duration ?? this.currentTrackLength;
    }

    private getProgressBarWidth(): number {
        const duration = this.getCurrentTrackLength();

        if (typeof duration === 'undefined') return 0;

        if (this.applyDrag && this.dragging) {
            return (this.getSeekPosition() / duration) * 100;
        }

        return (this.getCurrentSeekPosition() / duration) * 100;
    }

    setSeek(seek: number | undefined) {
        this.currentSeek = seek;
        this.animationStart = document.timeline.currentTime as number;
        this.updateSeekerTimes();
    }

    setCurrentTrack(track: Track | undefined) {
        this.currentTrack = track;

        this.updateSeekBar();
        this.updateSeekerTimes();
    }

    async pause() {
        await player.pause();
    }

    async play() {
        await player.play();
    }

    async nextTrack() {
        await player.nextTrack();
    }

    async previousTrack() {
        await player.previousTrack();
    }

    private handlePlaybackUpdate(update: Omit<PlaybackUpdate, 'sessionId'>) {
        if (typeof update.seek !== 'undefined') {
            this.setSeek(update.seek);
        }
        if (update.play || update.playing) {
            this.setPlaying(true);
        } else if (update.playing === false) {
            this.setPlaying(false);
        }
        if (update.tracks || typeof update.position === 'number') {
            this.setCurrentTrack(
                player.playlist()![player.playlistPosition()!],
            );
        }
    }

    private handleCurrentTrackLengthUpdate(length: number | undefined) {
        this.currentTrackLength = length;

        this.updateSeekBar();
        this.updateSeekerTimes();
    }

    connectedCallback() {
        this.htmlElements('.pause-button').forEach((e) => {
            e.addEventListener('click', () => this.pause());
        });

        this.htmlElements('.play-button').forEach((e) => {
            e.addEventListener('click', () => this.play());
        });

        this.htmlElements('.next-track-button').forEach((e) => {
            e.addEventListener('click', () => this.nextTrack());
        });

        this.htmlElements('.previous-track-button').forEach((e) => {
            e.addEventListener('click', () => this.previousTrack());
        });

        player.playbackUpdatedListener.on(this.playbackUpdatedListenerHandle);
        player.onCurrentSeekChanged(this.seekUpdatedListenerHandle);
        player.onCurrentTrackLengthChanged(
            this.currentTrackLengthListenerHandle,
        );
    }

    disconnectedCallback() {
        player.playbackUpdatedListener.off(this.playbackUpdatedListenerHandle);
        player.offCurrentSeekChanged(this.seekUpdatedListenerHandle);
        player.offCurrentTrackLengthChanged(
            this.currentTrackLengthListenerHandle,
        );
    }
}

export const tagName = 'moosicbox-player';
customElements.define(tagName, MoosicboxPlayer);
