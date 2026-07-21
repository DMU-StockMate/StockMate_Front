import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import LearnPage from './pages/LearnPage'
import LearnAiHistoryPage from './pages/LearnAiHistoryPage'
import LearnLevelPage from './pages/LearnLevelPage'
import LearnCustomPage from './pages/LearnCustomPage'
import LearnTopicPage from './pages/LearnTopicPage'
import QuizPage from './pages/QuizPage'
import BookmarkListPage from './pages/BookmarkListPage'
import AIPage from './pages/AIPage'
import AIDetailPage from './pages/AIDetailPage'
import TradePage from './pages/TradePage'
import TradeStocksPage from './pages/TradeStocksPage'
import WatchlistPage from './pages/WatchlistPage'
import StockDetailPage from './pages/StockDetailPage'
import TradeHistoryPage from './pages/TradeHistoryPage'
import MyPage from './pages/MyPage'
import ProfileEditPage from './pages/ProfileEditPage'
import NewsPage from './pages/NewsPage'
import RankingPage from './pages/RankingPage'
import CommunityPage from './pages/CommunityPage'
import CommunityPostDetailPage from './pages/CommunityPostDetailPage'
import CommunityPostWritePage from './pages/CommunityPostWritePage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminStocksPage from './pages/admin/AdminStocksPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 일반 사용자 페이지 */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/community/:postId" element={<CommunityPostDetailPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/community/write" element={<CommunityPostWritePage />} />
          <Route path="/community/:postId/edit" element={<CommunityPostWritePage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/ai-history" element={<LearnAiHistoryPage />} />
          <Route path="/learn/bookmarks" element={<BookmarkListPage />} />
          <Route path="/learn/quiz/:topicId/:questionId" element={<QuizPage />} />
          <Route path="/learn/custom" element={<LearnCustomPage />} />
          <Route path="/learn/:section" element={<LearnLevelPage />} />
          <Route path="/learn/:section/:topic" element={<LearnTopicPage />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/ai/:code" element={<AIDetailPage />} />
          <Route path="/trade" element={<TradePage />} />
          <Route path="/trade/stocks" element={<TradeStocksPage />} />
          <Route path="/trade/watchlist" element={<WatchlistPage />} />
          <Route path="/trade/stocks/:ticker" element={<StockDetailPage />} />
          <Route path="/trade/history" element={<TradeHistoryPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/mypage/edit" element={<ProfileEditPage />} />
        </Route>

        {/* 관리자 페이지 */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/stocks" element={<AdminStocksPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
