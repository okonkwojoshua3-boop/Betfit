import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')

    if (code) {
      // Explicitly exchange the PKCE code for a session
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error || !data.session) {
          navigate('/login', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      })
    } else {
      // No code in URL — check if session already exists
      supabase.auth.getSession().then(({ data: { session } }) => {
        navigate(session ? '/dashboard' : '/login', { replace: true })
      })
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <p className="text-slate-400 text-sm">Signing you in…</p>
    </div>
  )
}
