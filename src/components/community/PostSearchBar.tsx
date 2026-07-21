import type { KeyboardEvent } from 'react'
import Input from '../common/Input'
import Button from '../common/Button'

interface PostSearchBarProps {
  keyword: string
  onKeywordChange: (keyword: string) => void
  onSearch: () => void
}

export default function PostSearchBar({ keyword, onKeywordChange, onSearch }: PostSearchBarProps) {
  const handle_key_down = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') onSearch()
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ flex: 1 }}>
        <Input
          placeholder="제목 또는 내용으로 검색"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          onKeyDown={handle_key_down}
          leftIcon={<i className="bi bi-search" />}
        />
      </div>
      <Button variant="outline" onClick={onSearch}>검색</Button>
    </div>
  )
}
