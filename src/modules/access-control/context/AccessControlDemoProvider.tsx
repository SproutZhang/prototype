import { createContext, useContext, type ReactNode } from 'react'

import {
  useAccessControlDemoState,
  type RolesDrawerState,
} from './useAccessControlDemoState'

export type AccessControlDemoContextValue = ReturnType<typeof useAccessControlDemoState>

const AccessControlDemoContext = createContext<AccessControlDemoContextValue | null>(null)

export function AccessControlDemoProvider({ children }: { children: ReactNode }) {
  const value = useAccessControlDemoState()
  return <AccessControlDemoContext.Provider value={value}>{children}</AccessControlDemoContext.Provider>
}

export function useAccessControlDemo(): AccessControlDemoContextValue {
  const ctx = useContext(AccessControlDemoContext)
  if (!ctx) {
    throw new Error('useAccessControlDemo must be used within AccessControlDemoProvider')
  }
  return ctx
}

export type { RolesDrawerState }
