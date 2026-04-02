import { useState, useEffect, useCallback } from 'react'
import type { BetProof } from '../types'
import { useAuth } from '../store/AuthContext'
import { supabase } from '../lib/supabase'
import {
  getProofForBet,
  uploadProofPhoto,
  approveProof as dbApproveProof,
  rejectProof as dbRejectProof,
} from '../services/proofService'

export function useProof(betId: string) {
  const { user } = useAuth()
  const [proof, setProof] = useState<BetProof | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    // Initial fetch
    getProofForBet(betId).then(setProof).catch(console.error)

    // Real-time subscription — winner sees proof appear without refreshing
    const channel = supabase
      .channel(`proof:${betId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'proofs', filter: `bet_id=eq.${betId}` },
        () => {
          // Re-fetch on any change (insert, update) so we always have fresh data
          getProofForBet(betId).then(setProof).catch(console.error)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [betId])

  const uploadProof = useCallback(async (file: File) => {
    if (!user) return
    setUploading(true)
    try {
      const p = await uploadProofPhoto(betId, user.id, file)
      setProof(p)
    } finally {
      setUploading(false)
    }
  }, [betId, user])

  const approveProof = useCallback(async () => {
    await dbApproveProof(betId)
    setProof((prev) => prev ? { ...prev, status: 'approved' } : prev)
  }, [betId])

  const rejectProof = useCallback(async (note: string) => {
    await dbRejectProof(betId, note)
    setProof((prev) => prev ? { ...prev, status: 'rejected', rejectionNote: note } : prev)
  }, [betId])

  const clearProof = useCallback(() => {
    setProof(null)
  }, [])

  return { proof, uploading, uploadProof, approveProof, rejectProof, clearProof }
}
