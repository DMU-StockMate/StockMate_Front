const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

type GoogleCredentialResponse = { credential?: string }
type GoogleCallback = (response: GoogleCredentialResponse) => void

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: { client_id: string; callback: GoogleCallback }) => void
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void
        }
      }
    }
  }
}

let scriptPromise: Promise<void> | null = null
let activeCallback: GoogleCallback | null = null
let initialized = false

export const load_google_identity = () => {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('google script failed')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('google script failed'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

export const render_google_button = async (
  element: HTMLElement,
  callback: GoogleCallback,
) => {
  if (!GOOGLE_CLIENT_ID) throw new Error('Google Client ID is missing from the frontend build')
  await load_google_identity()
  const googleId = window.google?.accounts?.id
  if (!googleId) throw new Error('Google Identity Services is unavailable')

  activeCallback = callback
  if (!initialized) {
    googleId.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => activeCallback?.(response),
    })
    initialized = true
  }

  if (element.childElementCount === 0) {
    googleId.renderButton(element, {
      theme: 'outline',
      size: 'large',
      width: Math.min(400, Math.max(200, element.offsetWidth || 320)),
      text: 'continue_with',
    })
  }
}
