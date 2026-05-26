import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { WatchlistProvider } from './context/WatchlistContext'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <WatchlistProvider>
        <AdminAuthProvider>
          <App />
        </AdminAuthProvider>
      </WatchlistProvider>
    </AuthProvider>
  </StrictMode>,
)
