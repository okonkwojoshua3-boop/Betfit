import { supabase } from '../lib/supabase'
import type { BetProof } from '../types'

function rowToProof(row: Record<string, unknown>): BetProof {
  return {
    betId: row.bet_id as string,
    fileUrl: row.file_url as string,
    uploadedAt: row.created_at as string,
    status: row.status as BetProof['status'],
    rejectionNote: row.rejection_note as string | undefined,
  }
}

export async function getProofForBet(betId: string): Promise<BetProof | null> {
  const { data } = await supabase
    .from('proofs')
    .select('*')
    .eq('bet_id', betId)
    .order('created_at', { ascending: false })
    .maybeSingle()

  return data ? rowToProof(data) : null
}

export async function uploadProofPhoto(
  betId: string,
  userId: string,
  file: File,
): Promise<BetProof> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${betId}-${Date.now()}.${ext}`

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('proofs')
    .upload(path, file, { upsert: true })

  if (uploadError) throw uploadError

  // Get a signed URL (valid 1 year)
  const { data: urlData } = await supabase.storage
    .from('proofs')
    .createSignedUrl(path, 60 * 60 * 24 * 365)

  if (!urlData?.signedUrl) throw new Error('Failed to generate proof URL')

  // Delete existing proof for this bet (if re-uploading)
  await supabase.from('proofs').delete().eq('bet_id', betId)

  // Insert proof record
  const { data, error } = await supabase
    .from('proofs')
    .insert({
      bet_id: betId,
      uploaded_by: userId,
      file_url: urlData.signedUrl,
      status: 'pending_review',
    })
    .select()
    .single()

  if (error) throw error
  return rowToProof(data)
}

export async function approveProof(betId: string): Promise<void> {
  const { error } = await supabase
    .from('proofs')
    .update({ status: 'approved' })
    .eq('bet_id', betId)

  if (error) throw error
}

export async function rejectProof(betId: string, note: string): Promise<void> {
  const { error } = await supabase
    .from('proofs')
    .update({ status: 'rejected', rejection_note: note })
    .eq('bet_id', betId)

  if (error) throw error
}
