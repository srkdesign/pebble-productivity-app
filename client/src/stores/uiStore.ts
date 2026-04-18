import { create } from "zustand";

interface UiStore {
  targetRef: React.RefObject<HTMLDivElement | null> | null;
  setTargetRef: (ref: React.RefObject<HTMLDivElement | null>) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  targetRef: null,
  setTargetRef: (ref) => set({ targetRef: ref }),
}));
