import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { Clock, Star, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '../../components/Toast'
import { useEffect, useState } from 'react'
import { dataService } from '../../services/dataService'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import type { Database } from '../../types/database.types'


type RouteDetail = Database['public']['Tables']['routes']['Row'] & {
  route_sections: Database['public']['Tables']['route_sections']['Row'][]
}

export default function RouteDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { setSelectedRoute, setIsLiked } = useOutletContext<{
    setSelectedRoute: (route: RouteDetail) => void;
    setIsLiked: (isLiked: boolean) => void;
  }>()
  
  const [route, setRoute] = useState<RouteDetail | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Image Carousel State
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [allImages, setAllImages] = useState<string[]>([])
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  const loadRouteDetail = async (routeId: string) => {
    setLoading(true)
    const { data, error } = await dataService.getRouteById(routeId)
    if (error) {
      console.error('Failed to load route:', error)
      showToast('加载路线详情失败', 'error')
    } else if (data) {
      setRoute(data)
      setSelectedRoute(data)
      
      // Check if user has liked this route
      if (user) {
        const { isLiked } = await dataService.checkIsLiked(user.id, routeId)
        setIsLiked(isLiked)
      } else {
        setIsLiked(false)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    if (id) {
      loadRouteDetail(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Realtime Subscription
  useEffect(() => {
    if (!id) return

    const channel = supabase
      .channel(`public:routes:id=${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'routes', filter: `id=eq.${id}` },
        (payload) => {
          console.log('Route updated:', payload)
          showToast('路线信息已更新', 'info')
          loadRouteDetail(id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  // Preload images
  useEffect(() => {
    if (route) {
      // 收集所有有效图片 (images 数组 + 旧版 cover_image_url)
      const images: string[] = (route as Database['public']['Tables']['routes']['Row'] & { images?: string[] }).images || []
      
      if (images.length === 0 && route.cover_image_url) {
        images.push(route.cover_image_url)
      }

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

      // Preload all images for better performance
      images.forEach(imageUrl => {
        const img = new Image()
        img.src = imageUrl
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

  // 整理 section 排序 (Legacy support, but we rely on description mostly now)
  // const sortedSections = route.route_sections?.sort((a, b) => a.sort_order - b.sort_order) || []

  return (
    <div className="w-full flex flex-col min-h-screen bg-white overflow-hidden animate-fade-in">



      {/* Top Image Gallery */}
      <div className="w-full h-[60vh] sm:h-[50vh] md:h-[60vh] relative bg-slate-200 group overflow-hidden">
          {/* Blurred placeholder */}
          <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
              <div className="w-full h-full bg-slate-300 blur-sm opacity-50" style={{ 
                backgroundImage: `url(${allImages[currentImageIndex]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}></div>
          </div>
          
          {/* Main image with progressive loading */}
          <img 
              src={allImages[currentImageIndex]} 
              alt={route.name} 
              className={`w-full h-full object-cover cursor-zoom-in transition-all duration-800 ease-in-out ${loadedImages.has(allImages[currentImageIndex]) ? 'opacity-100 blur-0' : 'opacity-0 blur-md'}`}
              loading="lazy"
              onLoad={() => setLoadedImages(prev => new Set(prev).add(allImages[currentImageIndex]))}
          />
          
          {/* Loading indicator */}
          {!loadedImages.has(allImages[currentImageIndex]) && (
              <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
          )}
          
          {/* Carousel Controls */}
          {allImages.length > 1 && (
              <>
                  <button 
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-95 shadow-lg"
                  >
                      <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-95 shadow-lg"
                  >
                      <ChevronRight className="w-5 h-5" />
                  </button>
                  {/* Dots Indicator */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none px-4">
                      {allImages.map((_, idx) => (
                          <div 
                              key={idx}
                              className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${idx === currentImageIndex ? 'bg-white w-5' : 'bg-white/50 w-2'}`}
                          />
                      ))}
                  </div>
              </>
          )}
      </div>

      {/* Content & Interaction */}
      <div className="w-full flex flex-col flex-1 bg-white relative">
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar">
              {/* Title Section */}
              <div className="mb-6">
                  <div className="flex items-start justify-between mb-3">
                      <h1 className="text-xl font-bold text-slate-900 leading-tight">{route.name}</h1>
                  </div>
                  
                  {/* Stats Row */}
                  <div className="flex items-center w-full flex-wrap gap-2">
                       <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-2 rounded-full text-sm text-slate-700 flex-1 whitespace-nowrap">
                          <Star className={`w-4 h-4 ${route.difficulty > 3 ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400'}`} />
                          <span className="whitespace-nowrap">难度 {route.difficulty}</span>
                       </div>
                       <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-2 rounded-full text-sm text-slate-700 flex-1 justify-center whitespace-nowrap">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="whitespace-nowrap">预计 {route.duration_hours} 小时</span>
                       </div>
                       <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-2 rounded-full text-sm text-slate-700 flex-1 justify-end whitespace-nowrap">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="whitespace-nowrap">路程 {route.distance_km} km</span>
                       </div>
                  </div>
              </div>

              {/* Rich Text Content */}
              <div className="max-w-full">
                  {(route as Database['public']['Tables']['routes']['Row'] & { description?: string }).description ? (
                    <div className="ql-editor-content">
                      <div 
                          className="text-slate-700 max-w-none space-y-5 ql-editor"
                          dangerouslySetInnerHTML={{ __html: (route as Database['public']['Tables']['routes']['Row'] & { description?: string }).description || '' }}
                      />
                    </div>
                  ) : (
                      <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <p className="text-slate-400 italic">暂无详细介绍...</p>
                      </div>
                  )}
              </div>
              
              {/* 富文本内容样式通过Tailwind CSS类名控制 */}
          </div>
      </div>


    </div>
  )
}
