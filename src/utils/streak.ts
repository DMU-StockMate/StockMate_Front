import type { QuizAttempt } from '../api/learning'

const get_attempt_date = (attempt: QuizAttempt) => attempt.solved_at ?? attempt.solvedAt ?? ''

const to_day_key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

// 연속 학습일: 오늘(또는 아직 안 풀었다면 어제)부터 거꾸로 하루씩 확인해 끊기기 전까지 센다.
export const calc_streak_days = (histories: QuizAttempt[]): number => {
  const days = new Set(
    histories.map(get_attempt_date).filter(Boolean).map((iso) => to_day_key(new Date(iso))),
  )
  if (days.size === 0) return 0

  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  if (!days.has(to_day_key(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(to_day_key(cursor))) return 0
  }

  let streak = 0
  while (days.has(to_day_key(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
