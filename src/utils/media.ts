import { API_BASE_URL } from '../api/axios'

export const resolve_media_url = (url?: string | null) => {
  if (!url) return ''
  if (/^(https?:|blob:|data:)/.test(url)) return url
  return `${API_BASE_URL.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`
}
