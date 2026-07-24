import Input from '../common/Input'
import Textarea from '../common/Textarea'
import Button from '../common/Button'
import Chip, { ChipRow } from '../common/Chip'
import StockBoardPicker from './StockBoardPicker'
import type { CommunityBoardType } from '../../api/community'

interface SelectedStock {
  ticker: string
  companyName: string
}

interface PostFormProps {
  boardType: CommunityBoardType
  onBoardTypeChange: (boardType: CommunityBoardType) => void
  boardTypeLocked: boolean
  selectedStock: SelectedStock | null
  onSelectStock: (stock: SelectedStock) => void
  title: string
  onTitleChange: (value: string) => void
  content: string
  onContentChange: (value: string) => void
  errors: { title?: string; content?: string; ticker?: string; general?: string }
  submitting: boolean
  onSubmit: () => void
  onCancel: () => void
}

export default function PostForm({
  boardType,
  onBoardTypeChange,
  boardTypeLocked,
  selectedStock,
  onSelectStock,
  title,
  onTitleChange,
  content,
  onContentChange,
  errors,
  submitting,
  onSubmit,
  onCancel,
}: PostFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!boardTypeLocked && (
        <ChipRow>
          <Chip active={boardType === 'STOCK'} onClick={() => onBoardTypeChange('STOCK')}>종목 게시판</Chip>
          <Chip active={boardType === 'FREE'} onClick={() => onBoardTypeChange('FREE')}>자유 게시판</Chip>
        </ChipRow>
      )}

      {boardType === 'STOCK' && (
        boardTypeLocked && selectedStock ? (
          <Input label="종목" value={`${selectedStock.companyName} (${selectedStock.ticker})`} disabled readOnly />
        ) : (
          <div>
            <div className="input-label" style={{ marginBottom: 6 }}>종목 선택</div>
            <StockBoardPicker selectedStock={selectedStock} onSelect={onSelectStock} />
            {errors.ticker && <span className="input-error-msg">{errors.ticker}</span>}
          </div>
        )
      )}

      <Input
        label="제목"
        placeholder="제목을 입력해주세요"
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        error={errors.title}
      />

      <Textarea
        label="내용"
        placeholder="내용을 입력해주세요"
        value={content}
        onChange={(event) => onContentChange(event.target.value)}
        error={errors.content}
        style={{ minHeight: 240 }}
      />

      {errors.general && <div style={{ color: 'var(--up)', fontSize: 13 }}>{errors.general}</div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="outline" onClick={onCancel}>취소</Button>
        <Button disabled={submitting} onClick={onSubmit}>{submitting ? '저장 중...' : '등록'}</Button>
      </div>
    </div>
  )
}
