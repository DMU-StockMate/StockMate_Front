# StockMate Frontend

StockMate는 주식 학습, AI 상담, 종목 조회, 관심종목, 모의투자, 커뮤니티 기능을 제공하는 React 기반 투자 학습 서비스입니다.

## 주요 기능

- 회원가입, 로그인, 인증 기반 라우팅
- 투자 성향 온보딩 및 마이페이지/프로필 수정
- 대시보드, 종목 랭킹, 뉴스, 종목 상세 조회
- 관심종목 등록/검색/관리
- 모의투자 매수/매도, 보유 현황, 거래 내역
- 학습 콘텐츠, 개념 학습, 퀴즈, 북마크, AI 생성 학습 이력
- AI 상담 및 종목별 AI 상세 페이지
- 커뮤니티 게시글 목록, 상세, 작성, 수정
- 관리자 대시보드, 회원 관리, 종목 관리

## 기술 스택

- React 19
- TypeScript
- Vite
- React Router
- Axios
- Tailwind CSS
- Bootstrap Icons

## 프로젝트 구조

```text
src
├─ api          # 백엔드 API 요청 함수
├─ assets       # 이미지 등 정적 리소스
├─ components   # 재사용 UI 컴포넌트
├─ constants    # 공통 상수
├─ context      # 인증/관심종목 전역 상태
├─ hooks        # 화면별 상태 및 이벤트 로직
├─ pages        # 라우트 단위 페이지
├─ utils        # 포맷팅, 유효성 검사 등 공통 유틸
├─ App.tsx      # 라우팅
└─ main.tsx     # 앱 진입점
```

## 실행 준비

Node.js 20 이상 사용을 권장합니다.

```bash
npm install
```

환경변수 파일을 생성합니다.

```bash
cp .env .env.local
```

백엔드 API 주소를 환경에 맞게 설정합니다.

```env
VITE_API_URL=http://localhost:3000
```

## 개발 실행

```bash
npm run dev
```

기본 접속 주소는 다음과 같습니다.

```text
http://localhost:5173
```

## 빌드 및 배포

프로덕션 빌드를 생성합니다.

```bash
npm run build
```

빌드 결과물은 `dist/`에 생성됩니다. 정적 호스팅 서비스에 `dist/` 디렉터리를 배포하면 됩니다.

SPA 라우팅을 사용하므로 배포 환경에서 모든 경로를 `index.html`로 fallback 처리해야 합니다.

## 배포 전 체크리스트

- `VITE_API_URL`이 운영 백엔드 주소를 바라보는지 확인
- 백엔드 CORS 허용 도메인에 프론트엔드 배포 도메인 추가
- 로그인 후 보호 라우트(`/dashboard`, `/learn`, `/trade`, `/mypage`) 접근 확인
- 관리자 계정으로 `/admin/dashboard` 접근 확인
- `npm run build` 성공 확인

## 스크립트

```bash
npm run dev      # 개발 서버 실행
npm run build    # 타입 체크 후 프로덕션 빌드
npm run lint     # ESLint 검사
npm run preview  # 빌드 결과 로컬 미리보기
```

## 라우팅 요약

- 공개 페이지: `/`, `/login`, `/signup`, `/news`, `/ranking`, `/community`
- 사용자 페이지: `/dashboard`, `/learn`, `/ai`, `/trade`, `/mypage`
- 관리자 페이지: `/admin/dashboard`, `/admin/users`, `/admin/stocks`
