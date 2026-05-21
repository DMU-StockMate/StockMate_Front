import { api } from './axios'

export type EmailPurpose = 'REGISTER' | 'RESET_PASSWORD'

export const api_send_email_code = (email: string, purpose: EmailPurpose) =>
  api.post('/auth/email/send-code', { email, purpose }, { timeout: 20000 })

export const api_verify_email_code = (email: string, code: string, purpose: EmailPurpose) =>
  api.post('/auth/email/verify-code', { email, code, purpose })
