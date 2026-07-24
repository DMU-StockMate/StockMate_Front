import type { SearchCategory, SearchResultItem } from '../../hooks/useGlobalSearch'

const CATEGORY_LABEL: Record<SearchCategory, string> = {
  STOCK: '종목',
  COMMUNITY: '커뮤니티',
  LEARNING: '학습',
}

const CATEGORY_ICON: Record<SearchCategory, string> = {
  STOCK: 'bi-graph-up-arrow',
  COMMUNITY: 'bi-chat-square-text',
  LEARNING: 'bi-journal-text',
}

interface GlobalSearchDropdownProps {
  query: string
  loading: boolean
  stockResults: SearchResultItem[]
  communityResults: SearchResultItem[]
  learningResults: SearchResultItem[]
  onSelect: (item: SearchResultItem) => void
}

export default function GlobalSearchDropdown({
  query,
  loading,
  stockResults,
  communityResults,
  learningResults,
  onSelect,
}: GlobalSearchDropdownProps) {
  const groups: [SearchCategory, SearchResultItem[]][] = [
    ['STOCK', stockResults],
    ['COMMUNITY', communityResults],
    ['LEARNING', learningResults],
  ]
  const hasAny = groups.some(([, items]) => items.length > 0)

  return (
    <div className="search-dropdown" onMouseDown={(event) => event.preventDefault()}>
      {!hasAny && !loading && (
        <div className="search-dropdown-empty">'{query}'에 대한 검색 결과가 없습니다.</div>
      )}
      {groups.map(([category, items]) => (
        items.length === 0 ? null : (
          <div key={category} className="search-dropdown-group">
            <div className="search-dropdown-label">{CATEGORY_LABEL[category]}</div>
            {items.map((item) => (
              <div key={item.id} className="search-dropdown-item" onClick={() => onSelect(item)}>
                <i className={`bi ${CATEGORY_ICON[category]}`} />
                <div>
                  <div className="search-dropdown-title">{item.title}</div>
                  {item.subtitle && <div className="search-dropdown-subtitle">{item.subtitle}</div>}
                </div>
              </div>
            ))}
          </div>
        )
      ))}
      {loading && <div className="search-dropdown-loading">검색 중...</div>}
    </div>
  )
}
