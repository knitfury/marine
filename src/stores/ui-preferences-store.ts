"use client";

/**
 * Small UI-preferences store for cross-page chrome state. Kept minimal on
 * purpose - a later phase wires the actual sidebar/shell UI that reads and
 * updates this.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiPreferencesState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useUiPreferencesStore = create<UiPreferencesState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
    }),
    {
      name: "marinelink-ui-preferences",
    }
  )
);
