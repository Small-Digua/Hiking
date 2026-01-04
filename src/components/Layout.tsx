import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Mountain, LogOut, User as UserIcon, Settings, Heart, Share2, CalendarPlus, Map, Calendar, User } from 'lucide-react'
import { AddToPlanModal } from './AddToPlanModal'
import clsx from 'clsx'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { supabase } from '../services/supabase'
import { dataService } from '../services/dataService'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { showToast } = useToast()
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<any>(null)
  const [bottomBarMode, setBottomBarMode] = useState<'nav' | 'action'>('nav')
  const [isLiked, setIsLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [isAddToPlanModalOpen, setIsAddToPlanModalOpen] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        try {
          // 从数据库查询用户角色信息
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error('检查管理员身份失败:', error)
            setIsAdmin(false)
          } else {
            // 如果数据库中角色为admin，或者邮箱是764855102@qq.com，都设置为管理员
            setIsAdmin((data as any)?.role === 'admin' || user.email === '764855102@qq.com')
          }
        } catch (err) {
          console.error('检查管理员身份失败:', err)
          // 出错时，默认不显示管理图标
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
    }
    checkAdmin()
  }, [user])

  // 监听路由变化，切换底部栏模式
  useEffect(() => {
    // 检查是否在路线详情页
    if (location.pathname.match(/^\/routes\//)) {
      setBottomBarMode('action')
    } else {
      setBottomBarMode('nav')
    }
  }, [location.pathname])

  // 处理收藏切换
  const handleToggleLike = async () => {
    if (!user || !selectedRoute) return
    
    if (likeLoading) return
    
    setLikeLoading(true)
    try {
      const { isLiked: newIsLiked, error } = await dataService.toggleLike(user.id, selectedRoute.id)
      
      if (error) {
        console.error('Failed to toggle like:', error)
        showToast('操作失败，请重试', 'error')
      } else {
        setIsLiked(newIsLiked || false)
        showToast(newIsLiked ? '已添加到收藏' : '已取消收藏', 'success')
      }
    } catch (err) {
      console.error('Toggle like error:', err)
      showToast('操作失败，请重试', 'error')
    } finally {
      setLikeLoading(false)
    }
  }

  // 处理加入行程按钮点击，显示日历模态框
  const handleAddToPlan = () => {
    if (!user) {
      showToast('请先登录', 'info')
      navigate('/login')
      return
    }
    if (!selectedRoute) {
      showToast('未选择路线', 'error')
      return
    }
    
    setIsAddToPlanModalOpen(true)
  }

  // 处理日期选择确认
  const handleAddToPlanConfirm = async (date: Date) => {
    if (!user || !selectedRoute) return
    
    try {
      // 只传递必填字段和可选的status字段，不传递数据库自动生成的字段
      const { error } = await dataService.createItinerary({
        user_id: user.id,
        route_id: selectedRoute.id,
        planned_date: date.toISOString(),
        status: 'Pending' as const
      })
      
      if (error) {
        console.error('Failed to add to plan:', error)
        showToast('加入行程失败', 'error')
      } else {
        showToast('已加入行程', 'success')
        navigate('/plan')
      }
    } catch (error) {
      console.error('Unexpected error adding to plan:', error)
      showToast('加入行程失败', 'error')
    }
  }
  
  const navItems = [
    { path: '/', label: '路线推荐', id: 'recommend', icon: Map },
    { path: '/plan', label: '行程规划', id: 'plan', icon: Calendar },
    { path: '/profile', label: '个人中心', id: 'profile', icon: User },
  ]

  const handleSignOut = async () => {
    await signOut()
    showToast('已退出登录', 'success')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm fixed w-full z-20 top-0 pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
                <Mountain className="text-emerald-600 w-7 h-7 sm:w-8 sm:h-8" />
                <span className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">徒步记</span>
              </Link>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={clsx(
                        'inline-flex items-center px-3 py-2 text-sm font-medium h-full transition-colors rounded-md',
                        isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      )}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              {user ? (
                <>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {isAdmin && (
                      <Link 
                        to="/admin" 
                        className="text-slate-500 hover:text-emerald-600 p-2 sm:p-2.5 rounded-full hover:bg-slate-100 transition-colors"
                        title="后台管理"
                      >
                        <Settings className="w-5 h-5" />
                      </Link>
                    )}
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
                      className="text-slate-400 hover:text-slate-600 p-2 sm:p-2.5 rounded-full hover:bg-slate-100 transition-colors"
                      title="退出登录"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md hover:bg-slate-50 transition">
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

      {/* 加入行程模态框 */}
      <AddToPlanModal
        isOpen={isAddToPlanModalOpen}
        onClose={() => setIsAddToPlanModalOpen(false)}
        onConfirm={handleAddToPlanConfirm}
        routeName={selectedRoute?.name || ''}
      />
      
      {/* 主体内容容器 */}
      <div className="pt-16 pb-28 min-h-screen flex flex-col relative">
        <Outlet context={{ setSelectedRoute, setIsLiked }} />
      </div>

      {/* 动态切换底部栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-20 shadow-sm transition-all duration-300 ease-in-out pb-safe-b">
        {bottomBarMode === 'nav' ? (
          <nav className="animate-slide-up">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-around h-20 items-center">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={clsx(
                        'flex flex-col items-center justify-center h-full flex-1 gap-1 transition-all duration-300 px-4',
                        isActive
                          ? 'text-emerald-600'
                          : 'text-slate-500 hover:text-emerald-500'
                      )}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>
        ) : (
          <div className="py-4 px-8 flex items-center justify-between gap-6 animate-slide-up">
            <div className="flex items-center gap-6">
              <button 
                onClick={handleToggleLike}
                disabled={likeLoading}
                className={`p-3 rounded-full transition-all active:scale-90 ${isLiked ? 'text-rose-500 bg-rose-50 hover:text-rose-600 hover:bg-rose-100' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}
                title={isLiked ? "取消收藏" : "收藏路线"}
              >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button className="p-3 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
                  <Share2 className="w-5 h-5" />
              </button>
            </div>
            <button 
                onClick={handleAddToPlan}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium text-sm shadow-sm shadow-emerald-200 flex items-center gap-2 transition-transform active:scale-95"
            >
                <CalendarPlus className="w-5 h-5" /> 
                加入行程
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
