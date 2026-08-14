import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api_get_concept, api_get_concepts, type ConceptDetail, type ConceptSummary } from '../api/learning'

export function useConceptDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [concept, setConcept] = useState<ConceptDetail | null>(null)
  const [conceptList, setConceptList] = useState<ConceptSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    let alive = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api_get_concept(slug)
        if (alive) setConcept(data)
      } catch {
        if (alive) setError('개념정리를 불러오지 못했습니다.')
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => { alive = false }
  }, [slug])

  useEffect(() => {
    let alive = true
    api_get_concepts()
      .then(({ data }) => { if (alive) setConceptList(data) })
      .catch(() => { if (alive) setConceptList([]) })
    return () => { alive = false }
  }, [])

  const { prevConcept, nextConcept } = useMemo(() => {
    const index = conceptList.findIndex((c) => c.slug === slug)
    if (index === -1) return { prevConcept: null, nextConcept: null }
    return {
      prevConcept: conceptList[index - 1] ?? null,
      nextConcept: conceptList[index + 1] ?? null,
    }
  }, [conceptList, slug])

  return { concept, loading, error, prevConcept, nextConcept }
}
