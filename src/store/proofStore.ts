import type { BetProof } from '../types'

const KEY = 'betfit_proofs'

function getAll(): Record<string, BetProof> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export function getProofByBetId(betId: string): BetProof | null {
  return getAll()[betId] ?? null
}

export function saveProof(proof: BetProof): void {
  const all = getAll()
  all[proof.betId] = proof
  localStorage.setItem(KEY, JSON.stringify(all))
}
