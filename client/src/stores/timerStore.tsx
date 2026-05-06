// stores/timerStore.ts
import { create } from "zustand";
import { toast } from "@heroui/react";
import { startTimer, stopTimer } from "@api/tasks";
import { TimerIcon } from "@icons";

interface TimerStore {
  activeToastKey: string | null;
  activeTaskId: number | null;
  onUpdateRef: (() => void) | null; // ← live ref, updated by current page
  setOnUpdate: (fn: () => void) => void;
  toggleTimer: (
    taskId: number,
    taskTitle: string,
    isRunning: boolean,
  ) => Promise<void>;
  stopActiveTimer: () => Promise<void>;
  clearToast: () => void;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  activeToastKey: null,
  activeTaskId: null,
  onUpdateRef: null,

  setOnUpdate: (fn) => set({ onUpdateRef: fn }),

  clearToast: () => {
    const { activeToastKey } = get();

    if (activeToastKey) {
      toast.clear();
      set({ activeToastKey: null, activeTaskId: null });
    }
  },

  stopActiveTimer: async () => {
    const { activeTaskId, clearToast, onUpdateRef } = get(); // ← always live

    if (!activeTaskId) return;

    await stopTimer(activeTaskId);
    clearToast();
    onUpdateRef?.(); // ← calls whatever the current page registered
  },

  toggleTimer: async (taskId, taskTitle, isRunning) => {
    const { activeToastKey, clearToast, stopActiveTimer, onUpdateRef } = get();

    if (isRunning) {
      await stopTimer(taskId);
      clearToast();
      onUpdateRef?.();

      return;
    }

    if (activeToastKey) {
      await stopActiveTimer();
    }

    await startTimer(taskId);

    const key = `timer-${taskId}`;

    set({ activeToastKey: key, activeTaskId: taskId });

    toast(`Timer running: ${taskTitle}`, {
      timeout: 0,
      variant: "default",
      indicator: <TimerIcon color="currentColor" size={19} />,
      onClose: () => set({ activeToastKey: null, activeTaskId: null }),
      actionProps: {
        children: "Stop",
        variant: "tertiary",
        onPress: () => get().stopActiveTimer(), // ← get() reads live state
      },
    });

    onUpdateRef?.();
  },
}));
