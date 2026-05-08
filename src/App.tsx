import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import LearnPage from './pages/LearnPage'
import LearnLevelPage from './pages/LearnLevelPage'
import LearnTopicPage from './pages/LearnTopicPage'
import QuizPage from './pages/QuizPage'
import AIPage from './pages/AIPage'
import AIDetailPage from './pages/AIDetailPage'
import TradePage from './pages/TradePage'
import TradeStocksPage from './pages/TradeStocksPage'
import TradeHistoryPage from './pages/TradeHistoryPage'
import MyPage from './pages/MyPage'
import NewsPage from './pages/NewsPage'
import RankingPage from './pages/RankingPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/ranking" element={<RankingPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* 투자학습 */}
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/quiz/:topicId/:questionId" element={<QuizPage />} />
          <Route path="/learn/:section" element={<LearnLevelPage />} />
          <Route path="/learn/:section/:topic" element={<LearnTopicPage />} />
          {/* AI 분석 */}
          <Route path="/ai" element={<AIPage />} />
          <Route path="/ai/:code" element={<AIDetailPage />} />
          {/* 모의투자 */}
          <Route path="/trade" element={<TradePage />} />
          <Route path="/trade/stocks" element={<TradeStocksPage />} />
          <Route path="/trade/history" element={<TradeHistoryPage />} />
          {/* 기타 */}
          <Route path="/mypage" element={<MyPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
