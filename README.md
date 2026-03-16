# StockMate Frontend

주식 데이터 조회 및 분석을 위한 프론트엔드 프로젝트입니다.
**React 기반 웹 애플리케이션**으로 구현되었습니다.

---

## 🛠 Tech Stack

* **Framework**: React
* **Build Tool**: Vite
* **Language**: TypeScript / JavaScript
* **Routing**: React Router DOM
* **State Management**: Recoil
* **HTTP Client**: Axios
* **Styling**: Tailwind CSS
* **Mock API Server (Optional)**: json-server

---

## 📦 Installation

프로젝트를 실행하기 위해 아래 단계를 따라주세요.

### 1. Repository Clone

```bash
git clone https://github.com/your-id/stockmate-frontend.git
cd stockmate-frontend
```

### 2. Dependencies Install

```bash
npm install
```

또는 직접 라이브러리를 설치할 경우

```bash
npm install react-router-dom axios recoil
npm install -D tailwindcss postcss autoprefixer json-server
```

### 3. Development Server 실행

```bash
npm run dev
```

브라우저에서 접속

```
http://localhost:5173
```

---

## 📁 Project Structure

```
src
 ├─ api          # API 요청 관련 코드
 ├─ components   # 재사용 가능한 컴포넌트
 ├─ pages        # 페이지 단위 컴포넌트
 ├─ store        # Recoil 상태 관리
 ├─ assets       # 이미지 / 정적 파일
 ├─ App.tsx
 └─ main.tsx
```

---

## 🧪 Mock API Server (Optional)

테스트용 API 서버 실행

```bash
npx json-server --watch db.json --port 3001
```

---

## 🚀 Features (예정)

* 주식 종목 검색
* 실시간 가격 조회
* 차트 기반 데이터 시각화
* 관심 종목 관리
