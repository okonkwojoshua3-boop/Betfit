import { supabase } from '../lib/supabase'

const APP_URL = 'https://betfit.vercel.app'

// ── Send helper ───────────────────────────────────────────────────────────────

export async function sendBetEmail(params: {
  userIds: string[]
  subject: string
  html: string
}): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return

    await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    })
  } catch (err) {
    console.error('[emailService] sendBetEmail failed:', err)
  }
}

// ── Layout wrapper ────────────────────────────────────────────────────────────

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Inter,ui-sans-serif,system-ui,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#111;border-radius:16px;padding:32px;border:1px solid #222;">
    <div style="margin-bottom:24px;">
      <span style="font-size:22px;font-weight:900;color:#22c55e;letter-spacing:-0.5px;">BetFit</span>
    </div>
    ${content}
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #1f1f1f;">
      <p style="color:#444;font-size:12px;margin:0;">BetFit — Bet on sports, pay with exercise</p>
    </div>
  </div>
</body>
</html>`
}

function btn(label: string, href: string, color = '#22c55e', textColor = '#000'): string {
  return `<a href="${href}" style="display:inline-block;background:${color};color:${textColor};padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">${label}</a>`
}

// ── Templates ─────────────────────────────────────────────────────────────────

export function emailBetChallenged(params: {
  creatorName: string
  matchName: string
  punishment: string
  betId: string
}): string {
  return wrap(`
    <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">You've been challenged ⚔️</h2>
    <p style="color:#aaa;font-size:15px;margin:0 0 20px;line-height:1.5;">
      <strong style="color:#fff;">${params.creatorName}</strong> challenged you to a bet on
      <strong style="color:#fff;">${params.matchName}</strong>.
    </p>
    <div style="background:#1a1a1a;border-radius:10px;padding:16px;margin-bottom:24px;">
      <p style="color:#666;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Punishment if you lose</p>
      <p style="color:#22c55e;font-size:18px;font-weight:700;margin:0;">${params.punishment}</p>
    </div>
    ${btn('View &amp; Accept Bet →', `${APP_URL}/bets/${params.betId}`)}
  `)
}

export function emailBetAccepted(params: {
  joinerName: string
  matchName: string
  betId: string
}): string {
  return wrap(`
    <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">Your bet is on 🔥</h2>
    <p style="color:#aaa;font-size:15px;margin:0 0 20px;line-height:1.5;">
      <strong style="color:#fff;">${params.joinerName}</strong> joined your bet on
      <strong style="color:#fff;">${params.matchName}</strong>. Game time.
    </p>
    ${btn('View Bet →', `${APP_URL}/bets/${params.betId}`)}
  `)
}

export function emailBetResultLost(params: {
  punishment: string
  matchResult: string
  betId: string
}): string {
  return wrap(`
    <h2 style="color:#ef4444;margin:0 0 8px;font-size:20px;">You lost 😬</h2>
    <p style="color:#aaa;font-size:15px;margin:0 0 16px;line-height:1.5;">${params.matchResult}</p>
    <div style="background:#1a1a1a;border-radius:10px;padding:16px;margin-bottom:24px;">
      <p style="color:#666;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Your punishment</p>
      <p style="color:#ef4444;font-size:18px;font-weight:700;margin:0;">${params.punishment}</p>
    </div>
    ${btn('Upload Proof →', `${APP_URL}/bets/${params.betId}`, '#ef4444', '#fff')}
  `)
}

export function emailBetResultWon(params: {
  matchResult: string
  betId: string
}): string {
  return wrap(`
    <h2 style="color:#22c55e;margin:0 0 8px;font-size:20px;">You won 🏆</h2>
    <p style="color:#aaa;font-size:15px;margin:0 0 20px;line-height:1.5;">
      ${params.matchResult} — your opponent is doing their punishment.
    </p>
    ${btn('View Bet →', `${APP_URL}/bets/${params.betId}`)}
  `)
}

export function emailProofRejected(params: {
  reason: string
  punishment: string
  betId: string
}): string {
  return wrap(`
    <h2 style="color:#f59e0b;margin:0 0 8px;font-size:20px;">Proof rejected ❌</h2>
    <p style="color:#aaa;font-size:15px;margin:0 0 16px;line-height:1.5;">Your proof submission was rejected.</p>
    <div style="background:#1a1a1a;border-radius:10px;padding:16px;margin-bottom:20px;border-left:3px solid #f59e0b;">
      <p style="color:#666;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Reason</p>
      <p style="color:#fff;font-size:15px;margin:0;">"${params.reason}"</p>
    </div>
    <p style="color:#aaa;font-size:14px;margin:0 0 20px;">Re-upload your proof of: <strong style="color:#fff;">${params.punishment}</strong></p>
    ${btn('Re-upload Proof →', `${APP_URL}/bets/${params.betId}`, '#f59e0b', '#000')}
  `)
}

export function emailCancelRequested(params: {
  requesterName: string
  matchName: string
  betId: string
}): string {
  return wrap(`
    <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">Cancel request</h2>
    <p style="color:#aaa;font-size:15px;margin:0 0 20px;line-height:1.5;">
      <strong style="color:#fff;">${params.requesterName}</strong> wants to cancel the bet on
      <strong style="color:#fff;">${params.matchName}</strong>.
    </p>
    ${btn('Approve or Decline →', `${APP_URL}/bets/${params.betId}`)}
  `)
}

export function emailCancelApproved(params: { approverName: string }): string {
  return wrap(`
    <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">Bet cancelled</h2>
    <p style="color:#aaa;font-size:15px;margin:0;">
      <strong style="color:#fff;">${params.approverName}</strong> approved the cancellation. The bet has been removed.
    </p>
  `)
}

export function emailCancelDeclined(params: {
  declinerName: string
  matchName: string
  betId: string
}): string {
  return wrap(`
    <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">Cancellation declined</h2>
    <p style="color:#aaa;font-size:15px;margin:0 0 20px;line-height:1.5;">
      <strong style="color:#fff;">${params.declinerName}</strong> declined the cancellation.
      The bet on <strong style="color:#fff;">${params.matchName}</strong> is still active.
    </p>
    ${btn('View Bet →', `${APP_URL}/bets/${params.betId}`)}
  `)
}
