import { ChipRow } from '../common/Chip'
import type { CommunitySortType } from '../../api/community'

const SORT_LABEL: Record<CommunitySortType, string> = {
  latest: '최신순',
  views: '조회순',
  likes: '좋아요순',
  comments: '댓글순',
}

interface PostSortBarProps {
  value: CommunitySortType
  onChange: (sort: CommunitySortType) => void
}

export default function PostSortBar({ value, onChange }: PostSortBarProps) {
  return (
    <ChipRow>
      {(Object.keys(SORT_LABEL) as CommunitySortType[]).map((sort) => (
        <span
          key={sort}
          className={`chip ${value === sort ? 'active' : ''}`}
          onClick={() => onChange(sort)}
        >
          {SORT_LABEL[sort]}
        </span>
      ))}
    </ChipRow>
  )
}
