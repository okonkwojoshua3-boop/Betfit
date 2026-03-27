import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          console.error('[AuthCallback] exchangeCodeForSession error:', error)
          navigate('/login', { replace: true })
        } else if (data.session) {
          navigate('/dashboard', { replace: true })
        } else {
          console.error('[AuthCallback] No session returned after code exchange')
          navigate('/login', { replace: true })
        }
      })
    } else {
      console.warn('[AuthCallback] No code in URL')
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
