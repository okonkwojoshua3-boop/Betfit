import { createContext, useContext, type ReactNode } from 'react'
import { useBetStore } from './useBetStore'

type BetStoreReturn = ReturnType<typeof useBetStore>

const BetContext = createContext<BetStoreReturn | null>(null)

export function BetProvider({ children }: { children: ReactNode }) {
  const store = useBetStore()
  return <BetContext.Provider value={store}>{children}</BetContext.Provider>
}

export function useBets(): BetStoreReturn {
  const ctx = useContext(BetContext)
  if (!ctx) throw new Error('useBets must be used within BetProvider')
  return ctx
}
