import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Mountain, LogOut, User as UserIcon } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { showToast } = useToast()
  
  const navItems = [
    { path: '/', label: '路线推荐', id: 'recommend' },
    { path: '/plan', label: '行程规划', id: 'plan' },
    { path: '/profile', label: '个人中心', id: 'profile' },
  ]

  const handleSignOut = async () => {
    await signOut()
    showToast('已退出登录', 'success')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm fixed w-full z-20 top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
                <Mountain className="text-emerald-600 w-8 h-8" />
                <span className="font-bold text-xl text-slate-800">徒步记录</span>
              </Link>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={clsx(
                        'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors',
                        isActive
                          ? 'border-emerald-500 text-slate-900'
                          : 'border-transparent text-slate-500 hover:border-gray-300 hover:text-gray-700'
                      )}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="flex items-center gap-3">
                    <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition">
                      {user.user_metadata.avatar_url ? (
                        <img
                          className="h-8 w-8 rounded-full bg-gray-100 object-cover"
                          src={user.user_metadata.avatar_url}
                          alt="User Avatar"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                           <UserIcon className="w-5 h-5" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-slate-700 hidden sm:block">
                        {user.user_metadata.username || user.email?.split('@')[0]}
                      </span>
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="text-slate-400 hover:text-slate-600 p-1"
                      title="退出登录"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-slate-900">
                    登录
                  </Link>
                  <Link to="/register" className="text-sm font-medium bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition">
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主体内容容器 */}
      <div className="pt-16 min-h-screen flex flex-col relative">
        <Outlet />
      </div>
    </div>
  )
}
