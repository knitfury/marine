"use client";

/**
 * Demo role-switcher store. Phase 1 has no real auth, so "who is logged in"
 * is just a UserRole selection persisted to localStorage - this is what
 * lets a later UI phase build a role switcher that survives page reloads
 * while the person clicks around the internal/dealer/customer experiences.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRole } from "@/types";

interface RoleState {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set) => ({
      role: "internal",
      setRole: (role) => set({ role }),
    }),
    {
      name: "marinelink-role",
    }
  )
);
