import { useState } from 'react'
import { tryOpenInBrowser } from '../../lib/browser'

/**
 * Shown when the user is inside a WebView (WhatsApp, Instagram, etc.).
 * Google OAuth doesn't work in WebViews — this guides the user to a real browser.
 */
export default function InAppBrowserWarning() {
  const [copied, setCopied] = useState(false)

  function handleOpenInBrowser() {
    const opened = tryOpenInBrowser()
    if (!opened) {
      // Fallback: copy the link so they can paste it in their browser
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      })
    }
  }

  return (
    <div
      className="rounded-2xl p-5 animate-fade-up animate-fill-both"
      style={{
        background: 'linear-gradient(160deg, #1A1505 0%, #110E03 100%)',
        border: '1px solid rgba(245,158,11,0.25)',
      }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)' }}
      />

      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl shrink-0">🔒</span>
        <div>
          <p className="font-semibold text-amber-400 text-sm mb-1">
            Sign-in blocked in this browser
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Google doesn't allow sign-in inside WhatsApp, Instagram, or other app browsers.
            Open BetFit in Safari or Chrome to continue.
          </p>
        </div>
      </div>

      <button
        onClick={handleOpenInBrowser}
        className="w-full flex items-center justify-center gap-2 font-semibold text-sm py-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
        style={{
          background: copied ? 'linear-gradient(135deg,#16A350,#0D7A3A)' : 'linear-gradient(135deg,#F59E0B,#D97706)',
          color: '#0D0900',
          boxShadow: '0 2px 12px rgba(245,158,11,0.2)',
        }}
      >
        {copied ? '✓ Link copied — paste in your browser' : '🌐 Open in Browser'}
      </button>

      <p className="text-[11px] text-slate-600 text-center mt-3">
        Or copy the link and paste it into Safari or Chrome
      </p>
    </div>
  )
}
