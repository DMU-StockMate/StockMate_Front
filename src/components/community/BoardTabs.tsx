import Chip, { ChipRow } from '../common/Chip'
import type { CommunityBoardType } from '../../api/community'

const BOARD_LABELS: Record<CommunityBoardType, string> = {
  STOCK: '종목 게시판',
  FREE: '자유 게시판',
}

interface BoardTabsProps {
  value: CommunityBoardType
  onChange: (boardType: CommunityBoardType) => void
}

export default function BoardTabs({ value, onChange }: BoardTabsProps) {
  return (
    <ChipRow>
      {(Object.keys(BOARD_LABELS) as CommunityBoardType[]).map((boardType) => (
        <Chip key={boardType} active={value === boardType} onClick={() => onChange(boardType)}>
          {BOARD_LABELS[boardType]}
        </Chip>
      ))}
    </ChipRow>
  )
}
