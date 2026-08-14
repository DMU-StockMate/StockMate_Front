import { useState } from 'react'
import Pill from '../common/Pill'
import { api_submit_answer, type ConceptQuiz } from '../../api/learning'

export default function ConceptQuizCard({ quiz }: { quiz: ConceptQuiz }) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ correct: boolean; reward: number; explanation: string | null } | null>(null)

  const handle_select = async (choiceId: number) => {
    if (result || submitting) return
    setSelectedId(choiceId)
    setSubmitting(true)
    try {
      const { data } = await api_submit_answer(quiz.questionId, choiceId)
      setResult({ correct: data.correct, reward: data.reward, explanation: data.explanation })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: 14 }}>
        <Pill variant="accent">개념 확인 퀴즈</Pill>
      </div>
      <div className="strong" style={{ fontSize: 16, marginBottom: 14 }}>{quiz.questionText}</div>

      {quiz.choices.map((choice, index) => {
        let optionClass = 'opt'
        if (result && choice.id === selectedId) optionClass += result.correct ? ' correct' : ' wrong'
        else if (choice.id === selectedId) optionClass += ' selected'
        return (
          <button
            key={choice.id}
            className={optionClass}
            onClick={() => void handle_select(choice.id)}
            disabled={!!result || submitting}
          >
            <span className="num">{index + 1}</span>
            <span>{choice.text}</span>
          </button>
        )
      })}

      {result && (
        <div className={`result-banner ${result.correct ? 'correct' : 'wrong'}`} style={{ marginTop: 14 }}>
          <div className="icon-circle">
            <i className={`bi ${result.correct ? 'bi-check-lg' : 'bi-x-lg'}`} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>
              {result.correct ? '정답입니다!' : '아쉽지만 오답이에요.'}
              {result.reward > 0 ? ` · +${result.reward.toLocaleString()}원` : ''}
            </div>
            {result.explanation && <div style={{ marginTop: 4, fontSize: 13 }}>{result.explanation}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
