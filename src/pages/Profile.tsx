import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { useBets } from '../store/BetContext'
import {
  updateProfile,
  checkUsernameAvailable,
  resizeImageTo200,
  uploadAvatar,
} from '../services/profileService'
import Avatar from '../components/ui/Avatar'

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ── Inline toggle ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0"
      style={{
        background: checked ? 'linear-gradient(135deg,#22D672,#16A350)' : 'rgba(255,255,255,0.1)',
        boxShadow: checked ? '0 0 10px rgba(34,214,114,0.3)' : 'none',
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: 'linear-gradient(160deg, #111D30 0%, #0D1525 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-4">{children}</p>
  )
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div
      className="flex-1 rounded-xl py-3 text-center"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className={`font-score text-2xl leading-none ${color}`}>{value}</div>
      <div className="text-[9px] text-slate-600 uppercase tracking-widest mt-1">{label}</div>
    </div>
  )
}

// ── Username validation ───────────────────────────────────────────────────────
function validateUsername(v: string): string | null {
  if (v.length < 3)  return 'At least 3 characters'
  if (v.length > 20) return 'Max 20 characters'
  if (!/^[a-zA-Z0-9_]+$/.test(v)) return 'Only letters, numbers and underscores'
  return null
}

export default function Profile() {
  const navigate = useNavigate()
  const { profile, signOut, refreshProfile } = useAuth()
  const { getCompletedBets, getActiveBets, getPendingBets } = useBets()

  // ── Field state ────────────────────────────────────────────────────────────
  const [username,    setUsername]    = useState(profile?.username ?? '')
  const [bio,         setBio]         = useState(profile?.bio ?? '')
  const [favTeam,     setFavTeam]     = useState(profile?.favourite_team ?? '')
  const [favSport,    setFavSport]    = useState<string>(profile?.favourite_sport ?? '')
  const [notifs,      setNotifs]      = useState(profile?.notifications_enabled ?? true)
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(profile?.avatar_url ?? null)

  // Sync fields when profile loads
  useEffect(() => {
    if (!profile) return
    setUsername(profile.username)
    setBio(profile.bio ?? '')
    setFavTeam(profile.favourite_team ?? '')
    setFavSport(profile.favourite_sport ?? '')
    setNotifs(profile.notifications_enabled ?? true)
    setAvatarUrl(profile.avatar_url ?? null)
  }, [profile])

  // ── Username uniqueness check ──────────────────────────────────────────────
  const debouncedUsername = useDebounce(username, 500)
  const [usernameError,     setUsernameError]     = useState<string | null>(null)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername,  setCheckingUsername]  = useState(false)

  useEffect(() => {
    const v = debouncedUsername.trim()
    const err = validateUsername(v)
    if (err) { setUsernameError(err); setUsernameAvailable(null); return }
    if (v === profile?.username) { setUsernameError(null); setUsernameAvailable(null); return }
    setCheckingUsername(true)
    checkUsernameAvailable(v, profile?.id ?? '')
      .then((ok) => { setUsernameAvailable(ok); setUsernameError(ok ? null : 'Username already taken') })
      .catch(() => setUsernameError(null))
      .finally(() => setCheckingUsername(false))
  }, [debouncedUsername, profile?.username, profile?.id])

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError,     setAvatarError]     = useState<string | null>(null)

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    if (!file.type.startsWith('image/')) { setAvatarError('Please select an image file'); return }
    if (file.size > 10 * 1024 * 1024) { setAvatarError('Image must be under 10 MB'); return }
    setAvatarError(null)
    setAvatarUploading(true)
    try {
      const blob = await resizeImageTo200(file)
      const url = await uploadAvatar(profile.id, blob)
      await updateProfile(profile.id, { avatar_url: url })
      setAvatarUrl(url)
      await refreshProfile()
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [profile, refreshProfile])

  // ── Save ───────────────────────────────────────────────────────────────────
  const [saving,     setSaving]     = useState(false)
  const [saveError,  setSaveError]  = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const canSave =
    !usernameError &&
    !checkingUsername &&
    username.trim().length >= 3 &&
    (username !== profile?.username ||
     bio      !== (profile?.bio ?? '') ||
     favTeam  !== (profile?.favourite_team ?? '') ||
     favSport !== (profile?.favourite_sport ?? '') ||
     notifs   !== (profile?.notifications_enabled ?? true))

  async function handleSave() {
    if (!profile || !canSave) return
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      await updateProfile(profile.id, {
        username:             username.trim(),
        bio:                  bio.trim() || null,
        favourite_team:       favTeam.trim() || null,
        favourite_sport:      favSport || null,
        notifications_enabled: notifs,
      })
      await refreshProfile()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const completed = getCompletedBets()
  const active    = getActiveBets()
  const pending   = getPendingBets()
  let wins = 0, losses = 0, draws = 0
  for (const bet of completed) {
    const parts = bet.participants ?? []
    const me = parts.find((p) => p.userId === profile?.id)
    if (bet.losingTeamId === 'draw' || bet.loserId === 'draw') { draws++; continue }
    if (me && bet.losingTeamId) {
      me.teamPickId === bet.losingTeamId ? losses++ : wins++
    } else if (bet.loserId) {
      const iAmCreator = bet.creatorId === profile?.id
      ;(bet.loserId === 'creator' && iAmCreator) || (bet.loserId === 'opponent' && !iAmCreator)
        ? losses++ : wins++
    }
  }
  const total = wins + losses + draws
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : '—'

  if (!profile) return null

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2 animate-fade-up animate-fill-both">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          ←
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Profile</h1>
          <p className="text-[11px] text-slate-500">Member since {memberSince}</p>
        </div>
      </div>

      {/* Avatar + identity */}
      <SectionCard className="animate-fade-up animate-fill-both">
        <div className="flex items-center gap-5">
          {/* Avatar upload */}
          <div className="relative shrink-0 group">
            <div className="w-20 h-20 rounded-full overflow-hidden" style={{ border: '2px solid rgba(34,214,114,0.3)' }}>
              {avatarUploading ? (
                <div className="w-full h-full flex items-center justify-center animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-xs text-slate-400">…</span>
                </div>
              ) : (
                <Avatar url={avatarUrl} username={profile.username} size="xl" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              style={{ background: 'rgba(0,0,0,0.55)' }}
              title="Change photo"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-white text-xl truncate">{profile.username}</p>
            <p className="text-xs text-slate-500 truncate">{profile.bio || 'No bio yet'}</p>
            {avatarError && <p className="text-[11px] text-red-400 mt-1">{avatarError}</p>}
            <p className="text-[10px] text-slate-600 mt-1">Tap photo to change · auto-cropped to 200×200</p>
          </div>
        </div>
      </SectionCard>

      {/* Edit fields */}
      <SectionCard className="animate-fade-up animate-fill-both space-y-4" style={{ animationDelay: '60ms' } as React.CSSProperties}>
        <SectionTitle>Edit Profile</SectionTitle>

        {/* Username */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Username</label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              placeholder="your_username"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all pr-8"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${usernameError ? 'rgba(239,68,68,0.4)' : usernameAvailable === true ? 'rgba(34,214,114,0.4)' : 'rgba(255,255,255,0.1)'}`,
              }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">
              {checkingUsername ? (
                <span className="text-slate-500">…</span>
              ) : usernameAvailable === true ? (
                <span className="text-neon-green">✓</span>
              ) : usernameAvailable === false ? (
                <span className="text-red-400">✗</span>
              ) : null}
            </div>
          </div>
          {usernameError && <p className="text-[11px] text-red-400 mt-1">{usernameError}</p>}
          {usernameAvailable === true && <p className="text-[11px] text-neon-green mt-1">Username available</p>}
          <p className="text-[10px] text-slate-600 mt-1">3–20 chars, letters / numbers / underscores</p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 150))}
            rows={2}
            placeholder="Say something about yourself…"
            className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none resize-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
          <p className={`text-[10px] mt-1 text-right ${bio.length >= 140 ? 'text-amber-400' : 'text-slate-600'}`}>
            {bio.length} / 150
          </p>
        </div>

        {/* Favourite sport */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Favourite Sport</label>
          <div className="flex gap-2">
            {[
              { value: '',           label: 'None',       emoji: '—'  },
              { value: 'football',   label: 'Football',   emoji: '⚽' },
              { value: 'basketball', label: 'Basketball', emoji: '🏀' },
            ].map(({ value, label, emoji }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFavSport(value)}
                className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: favSport === value ? 'linear-gradient(135deg,rgba(34,214,114,0.15),rgba(34,214,114,0.05))' : 'rgba(255,255,255,0.03)',
                  border: favSport === value ? '1px solid rgba(34,214,114,0.35)' : '1px solid rgba(255,255,255,0.08)',
                  color: favSport === value ? '#22D672' : '#64748B',
                }}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Favourite team */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Favourite Team <span className="text-slate-600">(optional)</span></label>
          <input
            type="text"
            value={favTeam}
            onChange={(e) => setFavTeam(e.target.value.slice(0, 40))}
            maxLength={40}
            placeholder="e.g. Arsenal, Lakers…"
            className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        {/* Save error */}
        {saveError && (
          <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{saveError}</p>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.98]"
          style={{
            background: canSave && !saving
              ? 'linear-gradient(135deg, #22D672, #16A350)'
              : 'rgba(255,255,255,0.05)',
            color: canSave && !saving ? '#080C14' : '#475569',
            boxShadow: canSave && !saving ? '0 2px 12px rgba(34,214,114,0.3)' : 'none',
          }}
        >
          {saving ? 'Saving…' : saveSuccess ? '✓ Saved!' : 'Save Changes'}
        </button>
      </SectionCard>

      {/* Stats */}
      <SectionCard className="animate-fade-up animate-fill-both" style={{ animationDelay: '120ms' } as React.CSSProperties}>
        <SectionTitle>Your Stats</SectionTitle>
        <div className="flex gap-2 mb-3">
          <StatPill value={wins}    label="Wins"   color="text-neon-green" />
          <StatPill value={losses}  label="Losses" color="text-red-400" />
          <StatPill value={draws}   label="Draws"  color="text-slate-400" />
          <StatPill value={`${winRate}%`} label="Rate" color={winRate >= 50 ? 'text-neon-green' : 'text-slate-400'} />
        </div>
        <div className="flex gap-2">
          <StatPill value={total}                       label="Total Bets"  color="text-slate-300" />
          <StatPill value={active.length}               label="Active"      color="text-neon-green" />
          <StatPill value={pending.length}              label="Pending"     color="text-amber-400" />
          <StatPill value={completed.filter(b => b.status === 'completed').length} label="Completed" color="text-slate-300" />
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard className="animate-fade-up animate-fill-both" style={{ animationDelay: '160ms' } as React.CSSProperties}>
        <SectionTitle>Notifications</SectionTitle>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white font-medium">Email Notifications</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Bet invites, results, and punishment reminders</p>
          </div>
          <Toggle
            checked={notifs}
            onChange={(v) => {
              setNotifs(v)
              if (profile) updateProfile(profile.id, { notifications_enabled: v }).then(refreshProfile).catch(() => {})
            }}
          />
        </div>
      </SectionCard>

      {/* Account */}
      <SectionCard className="animate-fade-up animate-fill-both" style={{ animationDelay: '200ms' } as React.CSSProperties}>
        <SectionTitle>Account</SectionTitle>
        <div className="space-y-2">
          <div
            className="flex items-center justify-between px-3.5 py-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">Email</span>
            <span className="text-xs text-slate-400 truncate max-w-[200px]">{profile.id.slice(0, 8)}…</span>
          </div>

          <button
            onClick={async () => { await signOut(); navigate('/login') }}
            className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-red-400 transition-all active:scale-[0.99]"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <span className="text-sm font-semibold">Sign Out</span>
            <span className="text-base">→</span>
          </button>
        </div>
      </SectionCard>
    </div>
  )
}
