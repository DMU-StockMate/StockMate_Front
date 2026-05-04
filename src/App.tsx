import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/common/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import LearnPage from './pages/LearnPage'
import AIPage from './pages/AIPage'
import TradePage from './pages/TradePage'
import MyPage from './pages/MyPage'
import NewsPage from './pages/NewsPage'
import RankingPage from './pages/RankingPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/ranking" element={<RankingPage />} />

        {/* 인증 필요 라우트 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/:section" element={<LearnPage />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/trade" element={<TradePage />} />
          <Route path="/mypage" element={<MyPage />} />
        </Route>

        {/* 404 → 홈으로 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
