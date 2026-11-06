import { SUBSYSTEMS } from "@/config/subsystem.config"
import type { SubsystemConfig, SubsystemId } from "@/config/subsystem.config"

import { create } from "zustand"

interface SubsystemState {
  activeSubsystem: SubsystemId
  setActiveSubsystem: (id: SubsystemId) => void
  getActiveSubsystemConfig: () => SubsystemConfig | undefined
}

export const useSubsystemStore = create<SubsystemState>((set, get) => ({
  activeSubsystem: "attendance", // Default to attendance

  setActiveSubsystem: (id) => { set({ activeSubsystem: id }); },

  getActiveSubsystemConfig: () => {
    const { activeSubsystem } = get()
    return SUBSYSTEMS.find((s) => s.id === activeSubsystem)
  },
}))
