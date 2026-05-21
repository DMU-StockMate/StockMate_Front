import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

export default function AdminRoute() {
  const { isAdminLoggedIn, isLoading } = useAdminAuth()

  if (isLoading) return null

  if (!isAdminLoggedIn) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}
