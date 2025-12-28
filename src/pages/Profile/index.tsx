import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { dataService } from '../../services/dataService'
import { CheckInModal } from '../../components/CheckInModal'
import { SelectRouteModal } from '../../components/SelectRouteModal'
import { SettingsModal } from '../../components/SettingsModal'
import { format } from 'date-fns'
import type { Database } from '../../types/database.types'

type Route = Database['public']['Tables']['routes']['Row']
type HikingRecord = Database['public']['Tables']['hiking_records']['Row'] & {
  routes: Route | null
  media: { url: string }[]
}

export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalDistance: 0,
    completedCount: 0,
    citiesCount: 0,
    routesCount: 0
  })
  const [history, setHistory] = useState<HikingRecord[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [showSelectRoute, setShowSelectRoute] = useState(false)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)

  const fetchProfileData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await dataService.getUserHikingRecords(user.id)
      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setHistory(data as any) 
        
        // Calculate stats
        const totalDistance = data.reduce((acc, curr) => acc + (curr.routes?.distance_km || 0), 0)
        const uniqueCities = new Set(data.map(r => r.routes?.city_id).filter(Boolean)).size
        const uniqueRoutes = new Set(data.map(r => r.routes?.id).filter(Boolean)).size
        
        setStats({
          totalDistance: Math.round(totalDistance * 10) / 10,
          completedCount: data.length,
          citiesCount: uniqueCities,
          routesCount: uniqueRoutes
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchProfileData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const [showSettings, setShowSettings] = useState(false)

  // 提取所有媒体图片
  const allMedia = history.flatMap(record => record.media || [])
  const recentMedia = allMedia.slice(0, 9)

  const handleSettingsClick = () => {
    setShowSettings(true)
  }

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route)
    setShowSelectRoute(false)
    setShowCheckIn(true)
  }

  const handleCheckInConfirm = async (data: { date: Date; feelings: string; images: File[]; distance: number; duration: string }) => {
    if (!selectedRoute || !user) return

    try {
      // 1. Check/Create Itinerary
      const { data: itineraries } = await dataService.getUserItineraries(user.id)
      let itineraryId = itineraries?.find(i => i.route_id === selectedRoute.id && i.status === 'Pending')?.id

      if (!itineraryId) {
        const { data: newItinerary } = await dataService.createItinerary({
          user_id: user.id,
          route_id: selectedRoute.id,
          planned_date: data.date.toISOString(),
          status: 'Completed'
        })
        if (newItinerary) itineraryId = newItinerary.id
      } else {
        await dataService.updateItineraryStatus(itineraryId, 'Completed')
      }

      if (!itineraryId) throw new Error('Failed to handle itinerary')

      // 2. Create Record
      const { data: record } = await dataService.createHikingRecord({
        user_id: user.id,
        itinerary_id: itineraryId,
        completed_at: data.date.toISOString(),
        feelings: data.feelings,
        distance: data.distance,
        duration: data.duration
      })

      if (record) {
        // 3. Create Media Records (Mocking file upload for now)
        // In a real app, upload files to storage first, then save URLs
        for (const file of data.images) {
           await dataService.createMedia({
             record_id: record.id,
             user_id: user.id,
             type: file.type.startsWith('video') ? 'Video' : 'Image',
             // Using a placeholder service since we don't have storage bucket configured
             url: `https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=300&auto=format&fit=crop` 
           })
        }
      }

      await fetchProfileData()
      setShowCheckIn(false)
    } catch (error) {
      console.error('Check-in failed:', error)
      alert('打卡失败，请重试')
    }
  }

  return (
    <main className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="h-48 bg-gradient-to-r from-emerald-600 to-teal-700"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
        {/* 用户信息卡片 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 relative">
          <div className="sm:flex sm:items-end sm:space-x-5">
            <div className="flex">
              <img 
                onClick={handleSettingsClick}
                className="h-24 w-24 rounded-full ring-4 ring-white sm:h-32 sm:w-32 object-cover bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity" 
                src={user?.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=10b981&color=fff`} 
                alt="Avatar" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = `https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=10b981&color=fff`
                }}
              />
            </div>
            <div className="mt-4 sm:mt-0 sm:flex-1 sm:min-w-0 sm:flex sm:items-center sm:justify-between sm:space-x-6 sm:pb-1">
              <div className="sm:hidden md:block min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-slate-900 truncate">
                  {user?.user_metadata.username || user?.email?.split('@')[0] || '徒步爱好者'}
                </h1>
                <p className="text-sm text-slate-500">
                  加入于 {user?.created_at ? format(new Date(user.created_at), 'yyyy年MM月') : '2023年'}
                </p>
              </div>
              <div className="mt-6 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                <button 
                  onClick={handleSettingsClick}
                  className="inline-flex justify-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 items-center"
                >
                  <Settings className="w-4 h-4 mr-2" /> 设置
                </button>
              </div>
            </div>
          </div>
          
          {/* 统计数据 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-100">
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-slate-800">{stats.totalDistance}</span>
                <span className="text-sm font-medium text-slate-500">km</span>
              </div>
              <span className="block text-xs text-slate-400 mt-1">总距离</span>
            </div>
            <div className="text-center border-l border-slate-100">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-slate-800">{stats.routesCount}</span>
                <span className="text-sm font-medium text-slate-500">条</span>
              </div>
              <span className="block text-xs text-slate-400 mt-1">打卡路线</span>
            </div>
            <div className="text-center border-l border-slate-100">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-slate-800">{stats.completedCount}</span>
                <span className="text-sm font-medium text-slate-500">次</span>
              </div>
              <span className="block text-xs text-slate-400 mt-1">完成徒步</span>
            </div>
            <div className="text-center border-l border-slate-100">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-slate-800">{stats.citiesCount}</span>
                <span className="text-sm font-medium text-slate-500">座</span>
              </div>
              <span className="block text-xs text-slate-400 mt-1">点亮城市</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* 历史足迹 (时间轴) */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">历史足迹</h3>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : history.length > 0 ? (
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                {history.map((record, index) => (
                  <div key={record.id} className="relative pl-8">
                    <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white border-2 ${index === 0 ? 'border-emerald-500' : 'border-slate-300'}`}></div>
                    <div className={`mb-1 text-sm font-semibold ${index === 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {record.completed_at ? format(new Date(record.completed_at), 'yyyy-MM-dd') : ''}
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:border-emerald-100 transition">
                      <div className="flex justify-between items-start">
                        <h4 className="text-base font-bold text-slate-800">{record.routes?.name || '未知路线'}</h4>
                        {record.routes && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            {record.routes.distance_km} km
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-2">{record.feelings || '未填写心得'}</p>
                      {record.media && record.media.length > 0 && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {record.media.map((m, i) => (
                            <img 
                              key={i} 
                              src={m.url} 
                              className="rounded object-cover h-16 w-24 hover:opacity-90 cursor-pointer" 
                              alt="Record" 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop'
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <p>还没有打卡记录，快去探索吧！</p>
                <button onClick={() => navigate('/')} className="mt-4 text-emerald-600 font-bold hover:underline">
                  立即探索
                </button>
              </div>
            )}
          </div>

          {/* 我的相册 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">我的相册</h3>
              <button className="text-sm text-emerald-600 hover:underline">查看全部</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {recentMedia.length > 0 ? (
                recentMedia.map((media, index) => (
                  <img 
                    key={index} 
                    src={media.url} 
                    className="bg-slate-100 rounded object-cover aspect-square cursor-pointer hover:opacity-90 transition w-full h-full" 
                    alt="Gallery" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop'
                    }}
                  />
                ))
              ) : (
                <div className="col-span-3 bg-slate-50 rounded-lg p-8 flex flex-col items-center justify-center text-slate-400">
                   <p className="text-xs">暂无照片</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SelectRouteModal 
        isOpen={showSelectRoute}
        onClose={() => setShowSelectRoute(false)}
        onSelect={handleRouteSelect}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onUpdateUser={fetchProfileData}
      />
      
      {selectedRoute && (
        <CheckInModal
          isOpen={showCheckIn}
          onClose={() => setShowCheckIn(false)}
          onConfirm={handleCheckInConfirm}
          routeName={selectedRoute.name}
        />
      )}
    </main>
  )
}
