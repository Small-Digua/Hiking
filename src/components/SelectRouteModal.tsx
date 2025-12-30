import { useState, useEffect } from 'react'
import { X, Search, Loader2, MapPin, Clock } from 'lucide-react'
import { dataService } from '../services/dataService'
import type { Database } from '../types/database.types'


type Route = Database['public']['Tables']['routes']['Row']

interface SelectRouteModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (route: Route) => void
}

export function SelectRouteModal({ isOpen, onClose, onSelect }: SelectRouteModalProps) {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchRoutes()
      // 禁止背景滚动
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const fetchRoutes = async () => {
    setLoading(true)
    try {
      // 获取足够多的路线用于选择
      const { data } = await dataService.getAllRoutes(50)
      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setRoutes(data as any)
      }
    } catch (error) {
      console.error('Failed to fetch routes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRoutes = routes.filter(route => 
    route.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden animate-zoom-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">选择打卡路线</h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索路线名称..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <span>加载路线中...</span>
            </div>
          ) : filteredRoutes.length > 0 ? (
            filteredRoutes.map(route => (
              <div 
                key={route.id}
                onClick={() => onSelect(route)}
                className="group flex gap-4 p-3 rounded-xl border border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/30 cursor-pointer transition-all duration-200"
              >
                <img 
                  src={route.cover_image_url || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop'} 
                  alt={route.name}
                  className="w-24 h-24 rounded-lg object-cover bg-slate-100"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop'
                  }}
                />
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      {route.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">

                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{route.distance_km} km</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{route.duration_hours} h</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-500">
              未找到相关路线
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
