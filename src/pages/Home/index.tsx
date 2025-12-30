import { MapPin, Clock, Star, ArrowRight, Route, CalendarPlus, ChevronDown } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { dataService } from '../../services/dataService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { AddToPlanModal } from '../../components/AddToPlanModal'
import { supabase } from '../../services/supabase'
import type { Database } from '../../types/database.types'

type Route = Database['public']['Tables']['routes']['Row'] & {
  cities?: {
    name: string
  } | null
}
type City = Database['public']['Tables']['cities']['Row']

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const [routes, setRoutes] = useState<Route[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null)
  
  // Dropdown State
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false)
  const cityDropdownRef = useRef<HTMLDivElement>(null)

  const fetchCities = async () => {
    const { data } = await dataService.getCities()
    if (data) setCities(data)
  }

  useEffect(() => {
    // 首次加载城市
    fetchCities()
  }, []) // 只加载一次城市
  
  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchRoutes = async () => {
    setLoading(true)
    try {
      let data, error;
      
      if (!selectedCity || selectedCity === 'all') {
        // 获取所有路线
        ({ data, error } = await dataService.getAllRoutes())
      } else {
        // 获取特定城市路线
        ({ data, error } = await dataService.getRoutesByCity(selectedCity))
      }

      if (error) {
        console.error('Error fetching routes:', error)
      } else if (data) {
        // 手动处理类型，因为 Supabase join 查询的类型推导可能不完全
        // 确保 cities 字段存在
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedRoutes = data.map((route: any) => ({
           ...route,
           // 如果是按城市查询，后端可能没返回 cities 关联对象（因为已经知道城市了）
           // 需要补全 cities 对象以便前端统一展示
           cities: route.cities || cities.find(c => c.id === route.city_id) || null
        }))
        setRoutes(formattedRoutes)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 只有当城市列表加载完（如果有依赖逻辑），或者 selectedCity 变化时才加载路线
    // 这里我们允许 cities 为空时也加载（比如一开始就加载所有路线）
    fetchRoutes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, cities.length]) // 依赖 cities.length 确保城市加载完后能正确补全信息（如果是 client side join）

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel('public:routes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'routes' },
        (payload) => {
          console.log('Realtime update received:', payload)
          // Refresh data on any change
          fetchRoutes()
          if (payload.eventType === 'INSERT') {
             showToast('有新的路线发布了！', 'info')
          } else if (payload.eventType === 'UPDATE') {
             // Optional: check if updated route is currently visible
             // For now just generic toast
             // showToast('路线信息已更新', 'info')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedCity, cities]) // Re-subscribe if dependencies change (though fetchRoutes inside handles state)

  const handleAddToPlan = (e: React.MouseEvent, route: Route) => {
    e.preventDefault() // 阻止 Link 跳转
    if (!user) {
      showToast('请先登录', 'info')
      navigate('/login')
      return
    }
    setCurrentRoute(route)
    setIsModalOpen(true)
  }

  const handleConfirmAddToPlan = async (date: Date) => {
    if (!user || !currentRoute) return
    
    const { error } = await dataService.createItinerary({
      user_id: user.id,
      route_id: currentRoute.id,
      planned_date: date.toISOString(),
      status: 'Pending'
    })

    if (error) {
      console.error('Add itinerary error:', error)
      showToast('加入行程失败', 'error')
    } else {
      showToast('已成功加入行程规划！', 'success')
    }
  }

  // 获取当前选中城市名称
  const getSelectedCityName = () => {
    if (!selectedCity) return '所有城市'
    const city = cities.find(c => c.id === selectedCity)
    return city?.name || '所有城市'
  }
  
  // 处理城市选择
  const handleCitySelect = (cityId: string) => {
    setSelectedCity(cityId)
    setIsCityDropdownOpen(false)
  }

  const filteredRoutes = routes.filter(route => {
    if (selectedDifficulty === 'all') return true
    if (selectedDifficulty === '1-2') return route.difficulty >= 1 && route.difficulty <= 2
    if (selectedDifficulty === '3-4') return route.difficulty >= 3 && route.difficulty <= 4
    if (selectedDifficulty === '5') return route.difficulty >= 5
    return true
  })

  return (
    <>
      <AddToPlanModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmAddToPlan}
        routeName={currentRoute?.name || ''}
      />

      {/* Hero Section / 搜索过滤 */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-slate-800 mb-4">发现下一条徒步路线</h1>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            {/* 城市筛选 */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="text-slate-400 w-5 h-5" />
                <span className="text-sm font-medium text-slate-700">城市:</span>
              </div>
              {/* 自定义带有动画效果的下拉组件 */}
              <div ref={cityDropdownRef} className="relative z-10">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer"
                  onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                  aria-expanded={isCityDropdownOpen}
                >
                  <span>{getSelectedCityName()}</span>
                  <ChevronDown 
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                      isCityDropdownOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                {/* 带有动画效果的下拉菜单 */}
                {isCityDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden animate-slideDown z-50">
                    <div 
                      className="px-4 py-3 text-sm font-medium text-slate-700 hover:bg-emerald-50 cursor-pointer transition-colors"
                      onClick={() => handleCitySelect('')}
                    >
                      所有城市
                    </div>
                    {cities.map(city => (
                      <div
                        key={city.id}
                        className={`px-4 py-3 text-sm font-medium cursor-pointer transition-colors ${
                          selectedCity === city.id
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'text-slate-700 hover:bg-emerald-50'
                        }`}
                        onClick={() => handleCitySelect(city.id)}
                      >
                        {city.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* 难度筛选 */}
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-slate-700">难度:</span>
              <div className="grid grid-cols-4 gap-2">
                <button 
                  onClick={() => setSelectedDifficulty('all')}
                  className={`flex items-center justify-center px-3 py-2 rounded-2xl text-sm font-medium border transition-colors ${
                    selectedDifficulty === 'all' 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  全部
                </button>
                <button 
                  onClick={() => setSelectedDifficulty('1-2')}
                  className={`flex items-center justify-center px-3 py-2 rounded-2xl text-sm font-medium border transition-colors ${
                    selectedDifficulty === '1-2' 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  ★ 1-2
                </button>
                <button 
                  onClick={() => setSelectedDifficulty('3-4')}
                  className={`flex items-center justify-center px-3 py-2 rounded-2xl text-sm font-medium border transition-colors ${
                    selectedDifficulty === '3-4' 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  ★ 3-4
                </button>
                <button 
                  onClick={() => setSelectedDifficulty('5')}
                  className={`flex items-center justify-center px-3 py-2 rounded-2xl text-sm font-medium border transition-colors ${
                    selectedDifficulty === '5' 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  ★ 5
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow bg-slate-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* 路线列表 - 全宽布局 */}
          <div className="w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">热门路线</h2>
              <span className="text-sm text-slate-500">共找到 {filteredRoutes.length} 条路线</span>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500">加载中...</div>
            ) : filteredRoutes.length === 0 ? (
                <div className="text-center py-12 text-slate-500">暂无数据</div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredRoutes.map(route => (
                  <Link 
                    key={route.id} 
                    to={`/routes/${route.id}`}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200 group block"
                  >
                    <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                      {route.cover_image_url ? (
                          <img src={route.cover_image_url} alt={route.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">暂无图片</div>
                      )}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs font-bold text-slate-700 shadow-sm flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />{route.duration_hours} 小时
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">{route.name}</h3>
                        <div className="flex text-yellow-400 text-sm mt-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(route.difficulty) ? 'fill-current' : 'text-slate-300'}`} />
                            ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                          {route.cities?.name ? `位于：${route.cities.name}` : '探索未知的自然风光，享受徒步的乐趣。'}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center text-sm text-slate-600">
                          <Route className="w-4 h-4 mr-2 text-emerald-500" /><span>{route.distance_km} km</span>
                        </div>
                        <div className="flex gap-2">
                            <button 
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleAddToPlan(e, route)
                              }}
                              className="text-slate-400 hover:text-emerald-600 p-2 hover:bg-emerald-50 rounded transition z-10 relative"
                              title="加入规划"
                            >
                              <CalendarPlus className="w-4.5 h-4.5" />
                            </button>
                            <span className="text-emerald-600 group-hover:text-emerald-700 text-sm font-medium flex items-center px-3 py-1.5 rounded transition">
                              查看详情 <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
