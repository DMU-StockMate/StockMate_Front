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
    const src = 'https://accounts.google.com/gsi/client'
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    const script = existing ?? document.createElement('script')
    const cleanup = () => {
      window.clearTimeout(timeout)
      script.removeEventListener('load', onLoad)
      script.removeEventListener('error', onError)
    }
    const onError = () => {
      cleanup()
      script.remove()
      reject(new Error('구글 로그인 서비스를 불러오지 못했습니다. 네트워크 또는 브라우저 차단 설정을 확인한 뒤 새로고침해주세요.'))
    }
    const onLoad = () => {
      if (!window.google?.accounts?.id) return onError()
      cleanup()
      resolve()
    }
    const timeout = window.setTimeout(onError, 15000)
    script.addEventListener('load', onLoad, { once: true })
    script.addEventListener('error', onError, { once: true })
    if (!existing) {
      script.src = src
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  }).catch((error: unknown) => {
    scriptPromise = null
    throw error
  })

  return scriptPromise
}

export const render_google_button = async (
  element: HTMLElement,
  callback: GoogleCallback,
) => {
  if (!GOOGLE_CLIENT_ID) throw new Error('구글 로그인 설정이 없습니다. VITE_GOOGLE_CLIENT_ID 설정 후 개발 서버를 재시작하거나 다시 빌드해주세요.')
  await load_google_identity()
  const googleId = window.google?.accounts?.id
  if (!googleId) throw new Error('구글 로그인 서비스 초기화에 실패했습니다.')
  if (!element.isConnected) return

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
