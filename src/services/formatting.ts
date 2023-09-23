function zeroPad(num: number, places: number) {
    return String(num).padStart(places, '0');
}

export function toTime(seconds: number) {
    const minutes = ~~(seconds / 60);
    const minutesAndSeconds = `${minutes % 60}:${zeroPad(seconds % 60, 2)}`;

    if (minutes >= 60) {
        return `${~~(minutes / 60)}:${minutesAndSeconds}`;
    }

    return minutesAndSeconds;
}
