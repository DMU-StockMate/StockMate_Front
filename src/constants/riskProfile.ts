export type ProfileQuestionCategory = 'RISK' | 'KNOWLEDGE'

export interface ProfileQuestionOption {
  code: string
  label: string
}

export interface ProfileQuestion {
  code: string
  category: ProfileQuestionCategory
  text: string
  options: ProfileQuestionOption[]
}

export const RISK_PROFILE_QUESTIONS: ProfileQuestion[] = [
  {
    code: 'INVESTMENT_GOAL',
    category: 'RISK',
    text: '투자를 통해 가장 얻고 싶은 것은 무엇인가요?',
    options: [
      { code: 'PRINCIPAL_PROTECTION', label: '원금을 안전하게 지키는 것' },
      { code: 'STABLE_INCOME', label: '예금보다 조금 높은 안정적인 수익' },
      { code: 'BALANCED_GROWTH', label: '적당한 위험을 감수하고 꾸준한 자산 성장' },
      { code: 'HIGH_RETURN', label: '위험을 감수하더라도 높은 수익' },
    ],
  },
  {
    code: 'INVESTMENT_HORIZON',
    category: 'RISK',
    text: '이 투자금을 얼마나 오래 운용할 계획인가요?',
    options: [
      { code: 'UNDER_6_MONTHS', label: '6개월 이내' },
      { code: 'SIX_MONTHS_TO_1_YEAR', label: '6개월~1년' },
      { code: 'ONE_TO_3_YEARS', label: '1년~3년' },
      { code: 'OVER_3_YEARS', label: '3년 이상' },
    ],
  },
  {
    code: 'INVESTMENT_RATIO',
    category: 'RISK',
    text: '전체 자산 중 투자에 사용하는 금액의 비중은 어느 정도인가요?',
    options: [
      { code: 'UNDER_10_PERCENT', label: '10% 미만' },
      { code: 'TEN_TO_30_PERCENT', label: '10%~30%' },
      { code: 'THIRTY_TO_50_PERCENT', label: '30%~50%' },
      { code: 'OVER_50_PERCENT', label: '50% 이상' },
    ],
  },
  {
    code: 'LOSS_TOLERANCE',
    category: 'RISK',
    text: '투자 원금 대비 감당할 수 있는 손실 폭은 어느 정도인가요?',
    options: [
      { code: 'LOSS_10_PERCENT', label: '10% 이내' },
      { code: 'LOSS_20_PERCENT', label: '20% 이내' },
      { code: 'LOSS_30_PERCENT', label: '30% 이내' },
      { code: 'LOSS_50_PERCENT_OR_MORE', label: '50% 이상도 감내할 수 있다' },
    ],
  },
  {
    code: 'LOSS_REACTION',
    category: 'RISK',
    text: '보유 종목이 큰 폭으로 하락했을 때 어떻게 행동하시겠어요?',
    options: [
      { code: 'SELL_IMMEDIATELY', label: '즉시 매도해 손실을 확정한다' },
      { code: 'HOLD_AND_WAIT', label: '매도하지 않고 회복을 기다린다' },
      { code: 'BUY_MORE_AT_LOWER_PRICE', label: '가격이 낮아진 기회로 보고 추가 매수한다' },
      { code: 'INVEST_MORE_AGGRESSIVELY', label: '확신이 있다면 비중을 크게 늘린다' },
    ],
  },
  {
    code: 'RISK_RETURN_PREFERENCE',
    category: 'RISK',
    text: '다음 중 선호하는 투자 방식을 선택해주세요.',
    options: [
      { code: 'SAFE_LOW_RETURN', label: '연 3% 확정 수익' },
      { code: 'MODERATE_RISK_MODERATE_RETURN', label: '연 5~7% 기대, 원금 손실 가능성 낮음' },
      { code: 'HIGH_RISK_HIGH_RETURN', label: '연 10% 이상 기대, 원금 손실 가능성 있음' },
      { code: 'VERY_HIGH_RISK_VERY_HIGH_RETURN', label: '연 20% 이상 기대, 원금 손실 가능성 큼' },
    ],
  },
  {
    code: 'INVESTMENT_EXPERIENCE',
    category: 'KNOWLEDGE',
    text: '주식 투자 경험은 어느 정도인가요?',
    options: [
      { code: 'NONE', label: '투자 경험 없음' },
      { code: 'UNDER_1_YEAR', label: '1년 미만' },
      { code: 'ONE_TO_3_YEARS', label: '1년~3년' },
      { code: 'OVER_3_YEARS', label: '3년 이상' },
    ],
  },
  {
    code: 'TRADED_PRODUCTS',
    category: 'KNOWLEDGE',
    text: '지금까지 거래해 본 금융상품을 선택해주세요.',
    options: [
      { code: 'NONE', label: '거래해 본 상품 없음' },
      { code: 'DOMESTIC_STOCKS_ONLY', label: '국내 주식만' },
      { code: 'STOCKS_AND_ETF', label: '주식과 ETF' },
      { code: 'STOCKS_ETF_AND_DERIVATIVES', label: '주식, ETF, 선물·옵션 등 파생상품까지' },
    ],
  },
  {
    code: 'BASIC_CONCEPT_QUIZ',
    category: 'KNOWLEDGE',
    text: 'PER(주가수익비율)에 대한 설명으로 가장 알맞은 것은?',
    options: [
      { code: 'PER_CORRECT', label: '주가를 주당순이익(EPS)으로 나눈 값으로, 낮을수록 이익 대비 주가가 저평가된 것으로 볼 수 있다' },
      { code: 'PER_WRONG_1', label: '회사가 보유한 현금성 자산의 총합이다' },
      { code: 'PER_WRONG_2', label: '배당금을 주가로 나눈 비율이다' },
      { code: 'PER_WRONG_3', label: '주식 거래 시 부과되는 세금 비율이다' },
    ],
  },
  {
    code: 'ORDER_PROFIT_LOSS_QUIZ',
    category: 'KNOWLEDGE',
    text: '손절매(스탑로스) 주문의 목적으로 가장 알맞은 것은?',
    options: [
      { code: 'STOPLOSS_CORRECT', label: '손실이 일정 수준 이상 커지지 않도록 정해진 가격에 자동으로 매도하기 위함' },
      { code: 'STOPLOSS_WRONG_1', label: '주가가 오를 때 자동으로 추가 매수하기 위함' },
      { code: 'STOPLOSS_WRONG_2', label: '배당금을 자동으로 재투자하기 위함' },
      { code: 'STOPLOSS_WRONG_3', label: '매매 수수료를 할인받기 위함' },
    ],
  },
]

export const RISK_TYPE_LABELS: Record<string, string> = {
  CONSERVATIVE: '안정형',
  MODERATE_CONSERVATIVE: '안정추구형',
  BALANCED: '위험중립형',
  AGGRESSIVE: '적극투자형',
  VERY_AGGRESSIVE: '공격투자형',
}

export const INVESTMENT_PROFILE_DISCLAIMER =
  '본 진단은 학습 콘텐츠 추천을 위한 참고 자료이며, 실제 금융상품에 대한 투자 권유나 투자자 적합성 판단을 목적으로 하지 않습니다.'
