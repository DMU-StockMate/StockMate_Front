import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api_get_concepts, type ConceptSummary } from '../api/learning'
import { get_array } from '../utils/normalize'

const PAGE_SIZE = 9

export function useConcepts() {
  const navigate = useNavigate()
  const [concepts, setConcepts] = useState<ConceptSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState('전체')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let alive = true
    api_get_concepts()
      .then(({ data }) => { if (alive) setConcepts(get_array(data) as ConceptSummary[]) })
      .catch(() => { if (alive) setConcepts([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const levelTabs = useMemo(() => {
    const seen = new Map<number, string>()
    concepts.forEach((c) => {
      if (c.investmentLevel) seen.set(c.investmentLevel.investmentLevelId, c.investmentLevel.levelName)
    })
    return ['전체', ...Array.from(seen.entries()).sort(([a], [b]) => a - b).map(([, name]) => name)]
  }, [concepts])

  const filtered = useMemo(
    () => levelFilter === '전체' ? concepts : concepts.filter((c) => c.investmentLevel?.levelName === levelFilter),
    [concepts, levelFilter],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handle_set_level_filter = (level: string) => {
    setLevelFilter(level)
    setPage(1)
  }

  const handle_open_concept = (slug: string) => navigate(`/learn/concepts/${slug}`)

  return {
    concepts, filtered, paginated, loading,
    levelFilter, setLevelFilter: handle_set_level_filter, levelTabs,
    page: currentPage, totalPages, setPage,
    handle_open_concept,
  }
}
