import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // Verify the caller is an authenticated BetFit user
  const token = (req.headers.authorization ?? '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { userIds, subject, html } = req.body as {
    userIds: string[]
    subject: string
    html: string
  }

  if (!userIds?.length || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Look up each recipient's email using the service role key
  const emailResults = await Promise.all(
    userIds.map((id) => supabase.auth.admin.getUserById(id)),
  )

  const recipients = emailResults
    .map((r) => r.data?.user?.email)
    .filter((e): e is string => Boolean(e))

  if (!recipients.length) return res.status(200).json({ ok: true, sent: 0 })

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'BetFit <onboarding@resend.dev>',
    to: recipients,
    subject,
    html,
  })

  return res.status(200).json({ ok: true, sent: recipients.length })
}
