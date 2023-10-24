import { Api } from './api';

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type PartialUpdateSession = PartialBy<
    Omit<Api.PlaybackSession, 'activePlayers'>,
    'name' | 'active' | 'playing' | 'position' | 'seek' | 'playlist'
>;
