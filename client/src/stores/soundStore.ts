import { create } from "zustand";
import { persist } from "zustand/middleware";

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
        new Audio(src).play().catch(() => {});
      },
    }),
    { name: "sound-settings" },
  ),
);
