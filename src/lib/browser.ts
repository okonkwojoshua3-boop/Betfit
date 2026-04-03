/**
 * Detects whether the current environment is an in-app browser (WebView).
 * Google OAuth blocks these with Error 403: disallowed_useragent.
 *
 * Covers: WhatsApp, Instagram, Facebook, TikTok, WeChat, Line,
 *         Android WebView (wv flag), iOS WKWebView (no Safari in UA).
 */
export function isInAppBrowser(): boolean {
  const ua = navigator.userAgent

  // Explicit in-app browser identifiers
  if (/FBAN|FBAV|FB_IAB|Instagram|Line\/\d|MicroMessenger|TikTok|musical_ly/i.test(ua)) {
    return true
  }

  // Android WebView: UA contains the 'wv' flag
  if (/Android/.test(ua) && /\bwv\b/.test(ua)) {
    return true
  }

  // iOS WKWebView: has iPhone/iPad/iPod but lacks the 'Safari/' token
  // Real iOS browsers (Safari, Chrome, Firefox) all include 'Safari/' for compatibility
  if (/iPhone|iPad|iPod/.test(ua) && !/Safari\//.test(ua)) {
    return true
  }

  return false
}

/**
 * Attempts to open the current page in the device's default browser.
 * On Android we use an Intent URL targeting Chrome.
 * On iOS / unknown we just return false so the caller can fall back to copy-link.
 */
export function tryOpenInBrowser(): boolean {
  const ua = navigator.userAgent
  const url = window.location.href

  if (/Android/.test(ua)) {
    const host = window.location.hostname
    const path = window.location.pathname + window.location.search
    // Android Intent URL — opens Chrome; falls back to any browser if Chrome isn't installed
    window.location.href =
      `intent://${host}${path}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`
    return true
  }

  // iOS: try window.open — SFSafariViewController won't intercept _blank links in most apps
  const newWin = window.open(url, '_blank')
  if (newWin) {
    newWin.opener = null
    return true
  }

  return false
}
