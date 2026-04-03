import { useState } from 'react'
import { tryOpenInBrowser } from '../../lib/browser'

export default function InAppBrowserWarning() {
  const [copied, setCopied] = useState(false)

  function handleOpenInBrowser() {
    tryOpenInBrowser()
  }

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    })
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 animate-fade-up animate-fill-both"
      style={{
        background: 'linear-gradient(160deg, #1A1505 0%, #110E03 100%)',
        border: '1px solid rgba(245,158,11,0.25)',
        boxShadow: '0 0 32px rgba(245,158,11,0.06)',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)' }}
      />

      {/* Icon + message */}
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-xl"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
        >
          🔒
        </div>
        <div>
          <p className="font-display font-bold text-amber-400 text-sm mb-1 tracking-wide">
            Open in your browser to sign in
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Google blocks sign-in inside Snapchat, Instagram, WhatsApp, TikTok, and other app browsers. You need to open BetFit in Safari or Chrome.
          </p>
        </div>
      </div>

      {/* Primary: open in browser */}
      <button
        onClick={handleOpenInBrowser}
        className="w-full flex items-center justify-center gap-2 font-semibold text-sm py-3 rounded-xl mb-2.5 transition-all duration-200 active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg,#F59E0B,#D97706)',
          color: '#0D0900',
          boxShadow: '0 2px 12px rgba(245,158,11,0.25)',
        }}
      >
        🌐 Open in Browser
      </button>

      {/* Secondary: copy link */}
      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-center gap-2 font-medium text-sm py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
        style={{
          background: copied ? 'rgba(34,214,114,0.1)' : 'rgba(255,255,255,0.05)',
          border: copied ? '1px solid rgba(34,214,114,0.25)' : '1px solid rgba(255,255,255,0.08)',
          color: copied ? '#22D672' : '#94a3b8',
        }}
      >
        {copied ? '✓ Link copied!' : '📋 Copy link instead'}
      </button>

      <p className="text-[11px] text-slate-600 text-center mt-3 leading-relaxed">
        Paste the copied link into Safari or Chrome
      </p>
    </div>
  )
}
