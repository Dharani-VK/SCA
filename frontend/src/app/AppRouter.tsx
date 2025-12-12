import { Navigate, Route, Routes, Outlet } from 'react-router-dom'
// Forced HMR update
import DashboardPage from '../pages/DashboardPage'
import UploadPage from '../pages/UploadPage'
import DocumentsPage from '../pages/DocumentsPage'
import ChatPage from '../pages/ChatPage'
import QuizPage from '../pages/QuizPage'
import SettingsPage from '../pages/SettingsPage'
import AnalyticsPage from '../pages/AnalyticsPage'
import Login from '../pages/Login'
import Register from '../pages/Register'
import AdminLogin from '../pages/AdminLogin'
import AdminDashboard from '../pages/AdminDashboard'
import AdminPerformance from '../pages/AdminPerformance'
import AppShell from '../components/layout/AppShell'
import ProtectedRoute from '../components/ProtectedRoute'
import AdminRoute from '../components/AdminRoute'

function AppRouter() {
  return (
    <Routes>
      {/* Public Routes - Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* Protected Student Routes */}
      <Route element={
        <ProtectedRoute>
          <AppShell>
            <Outlet />
          </AppShell>
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Protected Admin Routes */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      } />

      <Route path="/admin/performance" element={
        <AdminRoute>
          <AdminPerformance />
        </AdminRoute>
      } />

      {/* Default Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRouter

