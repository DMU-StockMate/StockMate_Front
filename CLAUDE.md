# 프로젝트 코드 작성 규칙

## 기본 원칙
- Page는 화면 조립만 담당한다.
- Component는 UI 렌더링만 담당한다.
- Hook은 상태 관리와 이벤트 로직을 담당한다.
- Service는 API 요청만 담당한다.
- Utils는 공통 함수와 유효성 검사를 담당한다.

## 폴더 구조
- src/pages: 페이지 단위 컴포넌트
- src/components: 재사용 UI 컴포넌트
- src/hooks: 커스텀 훅
- src/api 또는 src/services: API 요청 함수
- src/utils: 공통 유틸 함수

## 코드 스타일
- 이벤트 함수는 handle_ 접두어를 사용한다.
- API 함수는 api_ 접두어를 사용한다.
- 들여쓰기는 2칸으로 한다.
- 불필요한 console.log는 제거한다.
- 한 파일에 여러 책임을 넣지 않는다.
