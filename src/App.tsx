import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Plan from './pages/Plan'
import Record from './pages/Record'
import RecordDetail from './pages/Record/Detail'
import Profile from './pages/Profile'
import RouteDetail from './pages/Routes/Detail'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import { AuthProvider, useAuth } from './context/AuthContext'


// Admin Pages
import AdminLayout from './pages/Admin/AdminLayout'
import Dashboard from './pages/Admin/Dashboard'
import UserManagement from './pages/Admin/Users'
import RouteManagement from './pages/Admin/Routes'
import CityManagement from './pages/Admin/Cities'
import TagManagement from './pages/Admin/Tags'

const NotFound = () => <div className="p-8 text-center">404 - 页面未找到</div>

// 路由守卫组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="p-8 text-center text-slate-500">加载中...</div>
  
  if (!user) {
    // 未登录跳转到登录页，并记录当前页面以便登录后跳回
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

function App() {
  return (
    <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="routes/:id" element={<RouteDetail />} />
            
            {/* 受保护的路由 */}
            <Route path="plan" element={
              <ProtectedRoute>
                <Plan />
              </ProtectedRoute>
            } />
            <Route path="record" element={
              <ProtectedRoute>
                <Record />
              </ProtectedRoute>
            } />
            <Route path="profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="records/:id" element={
              <ProtectedRoute>
                <RecordDetail />
              </ProtectedRoute>
            } />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="routes" element={<RouteManagement />} />
            <Route path="cities" element={<CityManagement />} />
            <Route path="tags" element={<TagManagement />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
    </AuthProvider>
  )
}

export default App
