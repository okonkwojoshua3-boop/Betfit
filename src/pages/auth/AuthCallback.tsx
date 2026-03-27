import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const search = window.location.search
    const hash = window.location.hash
    const code = new URLSearchParams(search).get('code')

    console.log('[AuthCallback] search:', search)
    console.log('[AuthCallback] hash:', hash)
    console.log('[AuthCallback] code:', code)

    if (code) {
      // PKCE flow — exchange the code for a session
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        console.log('[AuthCallback] exchangeCodeForSession result:', { session: data?.session, error })
        if (error) {
          setError(error.message)
        } else if (data.session) {
          navigate('/dashboard', { replace: true })
        }
      })
      return
    }

    if (hash && hash.includes('access_token')) {
      // Implicit flow — tokens are in the hash, Supabase client auto-processes them
      // Give it a moment to store the session, then check
      const hashParams = new URLSearchParams(hash.replace('#', ''))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ data, error }) => {
            console.log('[AuthCallback] setSession result:', { session: data?.session, error })
            if (error) {
              setError(error.message)
            } else if (data.session) {
              navigate('/dashboard', { replace: true })
            }
          })
      }
      return
    }

    // No code or hash — check if session already exists
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[AuthCallback] getSession result:', { session, error })
      if (session) {
        navigate('/dashboard', { replace: true })
      } else {
        setError('Sign in failed. Please try again.')
      }
    })
  }, [navigate])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      {error ? (
        <div className="text-center">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="text-emerald-400 hover:text-emerald-300 text-sm"
          >
            Back to login
          </button>
        </div>
      ) : (
        <p className="text-slate-400 text-sm">Signing you in…</p>
      )}
    </div>
  )
}
