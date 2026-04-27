import { create } from "zustand";
import { persist } from "zustand/middleware";

const cache: Record<string, HTMLAudioElement> = {};

const getAudio = (src: string) => {
  if (!cache[src]) {
    cache[src] = new Audio(src);
    cache[src].load();
  }

  return cache[src];
};

interface SoundStore {
  muted: boolean;
  toggleMute: () => void;
  play: (src: string) => void;
}

export const useSoundStore = create<SoundStore>()(
  persist(
    (set, get) => ({
      muted: false as boolean,
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      play: (src) => {
        if (get().muted) return;
        const audio = getAudio(src);
        audio.currentTime = 0;
        audio.play().catch(() => {});
      },
    }),
    { name: "sound-settings" },
  ),
);
