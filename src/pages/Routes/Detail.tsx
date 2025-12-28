import { useParams, useNavigate } from 'react-router-dom'
import { Clock, Star, MapPin, CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '../../components/Toast'
import { useEffect, useState } from 'react'
import { dataService } from '../../services/dataService'
import { useAuth } from '../../context/AuthContext'
import { AddToPlanModal } from '../../components/AddToPlanModal'
import type { Database } from '../../types/database.types'

type RouteDetail = Database['public']['Tables']['routes']['Row'] & {
  route_sections: Database['public']['Tables']['route_sections']['Row'][]
}

export default function RouteDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const [route, setRoute] = useState<RouteDetail | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Image Carousel State
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [allImages, setAllImages] = useState<string[]>([])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadRouteDetail = async (routeId: string) => {
    setLoading(true)
    const { data, error } = await dataService.getRouteById(routeId)
    if (error) {
      console.error('Failed to load route:', error)
      showToast('加载路线详情失败', 'error')
    } else if (data) {
      setRoute(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (id) {
      loadRouteDetail(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (route) {
      // 收集所有有效图片
      const images: string[] = []
      route.route_sections?.forEach(section => {
        if (section.image_url) {
          images.push(section.image_url)
        }
      })

      if (images.length === 0) {
        images.push('https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070&auto=format&fit=crop')
      }

      // Avoid setting state if it hasn't changed (basic check)
      setAllImages(prev => {
        if (prev.length === images.length && prev.every((url, i) => url === images[i])) {
          return prev
        }
        return images
      })
    }
  }, [route])

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1))
  }

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1))
  }

  const handleAddToPlanClick = () => {
    if (!user) {
      showToast('请先登录', 'info')
      navigate('/login')
      return
    }
    setIsModalOpen(true)
  }

  const handleConfirmAddToPlan = async (date: Date) => {
    if (!user || !route) return
    
    const { error } = await dataService.createItinerary({
      user_id: user.id,
      route_id: route.id,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">加载中...</div>
      </div>
    )
  }

  if (!route) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="text-slate-500">未找到该路线信息</div>
        <button onClick={() => navigate(-1)} className="text-emerald-600 hover:underline">返回上一页</button>
      </div>
    )
  }

  // 整理 section 排序
  const sortedSections = route.route_sections?.sort((a, b) => a.sort_order - b.sort_order) || []

  return (
    <div className="bg-slate-50 min-h-screen pb-12 animate-fade-in">
      <AddToPlanModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmAddToPlan}
        routeName={route.name}
      />

      {/* 顶部 Banner (Carousel) */}
      <div className="relative h-96 w-full group">
        <img 
            src={allImages[currentImageIndex]} 
            alt={route.name} 
            className="w-full h-full object-cover transition-opacity duration-500" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        
        {/* Carousel Controls */}
        {allImages.length > 1 && (
            <>
                <button 
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
                {/* Dots */}
                <div className="absolute bottom-24 left-0 w-full flex justify-center gap-2">
                    {allImages.map((_, idx) => (
                        <div 
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                        />
                    ))}
                </div>
            </>
        )}

        <div className="absolute bottom-0 left-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="flex items-center gap-2 text-white/90 text-sm mb-2">
            <span className="bg-emerald-600 px-2 py-0.5 rounded text-white font-medium">徒步路线</span>
            <span>• 户外探索</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">{route.name}</h1>
          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center text-yellow-400 text-sm">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < Math.floor(route.difficulty) ? 'fill-current' : 'text-slate-400'}`} 
                />
              ))}
              <span className="ml-2 text-white font-medium">{route.difficulty} 难度</span>
            </div>
            <span className="text-white/60">|</span>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> {route.duration_hours} 小时
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧内容 */}
          <div className="lg:w-2/3 space-y-8">
            {/* 数据卡片 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-500 uppercase">总距离</p>
                <p className="text-xl font-bold text-slate-800">{route.distance_km} <span className="text-sm font-normal text-slate-500">km</span></p>
              </div>
              <div className="border-l border-slate-100">
                <p className="text-xs text-slate-500 uppercase">预计用时</p>
                <p className="text-xl font-bold text-slate-800">{route.duration_hours} <span className="text-sm font-normal text-slate-500">h</span></p>
              </div>
              <div className="border-l border-slate-100">
                <p className="text-xs text-slate-500 uppercase">难度系数</p>
                <p className="text-xl font-bold text-slate-800">{route.difficulty} <span className="text-sm font-normal text-slate-500">/ 5.0</span></p>
              </div>
            </div>

            {/* 路线介绍 (图文混排) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4 border-l-4 border-emerald-500 pl-3">路线介绍</h2>
              <div className="prose text-slate-600 max-w-none space-y-6">
                {sortedSections.length > 0 ? sortedSections.map(section => (
                  <div key={section.id}>
                    <p className="leading-relaxed">{section.content}</p>
                    {section.image_url && (
                      <img 
                        src={section.image_url} 
                        alt="Route Section" 
                        className="w-full rounded-lg my-4 shadow-sm hover:shadow-md transition-shadow cursor-zoom-in"
                        onClick={() => window.open(section.image_url!, '_blank')}
                      />
                    )}
                  </div>
                )) : (
                    <p className="text-slate-400 italic">暂无详细介绍...</p>
                )}

                <h3 className="font-bold text-slate-800 text-lg mt-6">装备建议</h3>
                <ul className="list-disc pl-5 space-y-1">
                    {/* 暂时写死，后续可存入数据库 */}
                    <li>登山鞋或运动鞋（防滑很重要）</li>
                    <li>双肩背包，携带至少 1.5L 水</li>
                    <li>登山杖（推荐，尤其是下坡保护膝盖）</li>
                    <li>速干衣裤，视季节携带防风外套</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 右侧侧边栏 */}
          <div className="lg:w-1/3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
              <h3 className="font-bold text-lg text-slate-800 mb-4">开始计划</h3>
              <button 
                onClick={handleAddToPlanClick}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 mb-3"
              >
                <CalendarPlus className="w-5 h-5" /> 加入待办行程
              </button>
              {/* 已移除 GPX 下载按钮 */}
              
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="font-medium text-slate-800 mb-3">地图预览</h4>
                <div className="bg-slate-100 rounded-lg h-48 w-full flex items-center justify-center text-slate-400 border border-slate-200">
                  <span className="flex flex-col items-center">
                    <MapPin className="w-8 h-8 mb-2" />
                    地图加载中...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
