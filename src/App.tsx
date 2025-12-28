import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Plan from './pages/Plan'
import Record from './pages/Record'
import Profile from './pages/Profile'
import RouteDetail from './pages/Routes/Detail'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import { AuthProvider, useAuth } from './context/AuthContext'

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
          
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
