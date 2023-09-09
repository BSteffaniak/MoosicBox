import { createSignal } from "solid-js";

export const [currentPlayerId, setCurrentPlayerId] = createSignal<string | null>(null);
export const [playing, setPlaying] = createSignal(false);
