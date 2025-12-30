import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Loader2, Heart, PawPrint } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { dataService } from '../../services/dataService'
import { CheckInModal } from '../../components/CheckInModal'
import { SelectRouteModal } from '../../components/SelectRouteModal'
import { SettingsModal } from '../../components/SettingsModal'
import { ImagePreviewModal } from '../../components/ImagePreviewModal'
import { useToast } from '../../components/Toast'
import { format } from 'date-fns'
import { formatDuration } from '../../utils/formatDuration'
import type { Database } from '../../types/database.types'

type Route = Database['public']['Tables']['routes']['Row']
type HikingRecord = Database['public']['Tables']['hiking_records']['Row'] & {
  routes: Route | null
  media: { url: string }[]
}
type Favorite = {
  id: string
  created_at: string
  routes: Route & {
    cities: {
      name: string
    } | null
  }
}

export default function Profile() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalDistance: 0,
    completedCount: 0,
    citiesCount: 0,
    routesCount: 0
  })
  const [history, setHistory] = useState<HikingRecord[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [showSelectRoute, setShowSelectRoute] = useState(false)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0)

  const fetchProfileData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await dataService.getUserHikingRecords(user.id)
      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setHistory(data as any) 
        
        // Calculate stats
        const totalDistance = data.reduce((acc, curr) => {
          // 优先使用用户打卡时填写的实际距离，如果没有则使用路线预设距离
          const actualDistance = curr.distance || curr.routes?.distance_km || 0
          return acc + actualDistance
        }, 0)
        const uniqueCities = new Set(data.map(r => r.routes?.city_id).filter(Boolean)).size
        const uniqueRoutes = new Set(data.map(r => r.routes?.id).filter(Boolean)).size
        
        setStats({
          totalDistance: Math.round(totalDistance * 10) / 10,
          completedCount: data.length,
          citiesCount: uniqueCities,
          routesCount: uniqueRoutes
        })
      }

      // Fetch favorites
      const { data: favoritesData } = await dataService.getUserFavorites(user.id)
      if (favoritesData) {
        // 过滤掉没有对应路线的收藏记录
        const validFavorites = favoritesData.filter(fav => fav.routes !== null)
        setFavorites(validFavorites as Favorite[])
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

  const handleImageClick = (images: string[], initialIndex: number = 0) => {
    setPreviewImages(images)
    setPreviewInitialIndex(initialIndex)
    setShowImagePreview(true)
  }

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route)
    setShowSelectRoute(false)
    setShowCheckIn(true)
  }

  const handleCheckInConfirm = async (data: { date: Date; feelings: string; images: File[]; distance: number; duration: string }) => {
    if (!selectedRoute || !user) {
      throw new Error('用户或路线信息缺失')
    }

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
      // 3. Create Media Records (Upload files to Supabase Storage)
      for (const file of data.images) {
         try {
           // Generate unique path: userId/recordId/timestamp_filename
           const timestamp = new Date().getTime()
           const fileExt = file.name.split('.').pop()
           const filePath = `${user.id}/${record.id}/${timestamp}.${fileExt}`
           
           // Upload to Supabase Storage
           const publicUrl = await dataService.uploadImage(file, filePath)

           await dataService.createMedia({
             record_id: record.id,
             user_id: user.id,
             type: file.type.startsWith('video') ? 'Video' : 'Image',
             url: publicUrl 
           })
         } catch (err) {
           console.error('Failed to upload image:', file.name, err)
           // Continue with other images even if one fails
         }
      }
    }

    await fetchProfileData()
    setShowCheckIn(false)
  }

  return (
    <main className="bg-slate-50">
      <div className="py-8 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* 用户信息卡片 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 relative">
          {/* 右上角设置按钮 */}
          <button 
            onClick={handleSettingsClick}
            className="absolute top-4 right-4 p-2 border border-slate-300 shadow-sm rounded-full text-slate-700 bg-white hover:bg-slate-50 hover:border-emerald-500 transition-all"
            title="设置"
          >
            <Settings className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-4">
            <img 
              onClick={handleSettingsClick}
              className="h-28 w-28 rounded-full ring-4 ring-white sm:h-32 sm:w-32 object-cover bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity ml-[-10px] sm:ml-[-15px]"
              src={user?.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=10b981&color=fff`} 
              alt="Avatar" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = `https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=10b981&color=fff`
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-1">
                <h1 className="text-lg font-bold text-slate-900 truncate">
                  {user?.user_metadata.username || user?.email?.split('@')[0] || '徒步爱好者'}
                </h1>
                <p className="text-xs text-slate-500">
                  加入于 {user?.created_at ? format(new Date(user.created_at), 'yyyy年MM月') : '2023年'}
                </p>
              </div>
            </div>
          </div>
          
          {/* 统计数据 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
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

        {/* 历史足迹 (时间轴) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <PawPrint className="w-6 h-6 text-emerald-600 -scale-x-100" />
              <h3 className="text-lg font-bold text-slate-800">历史足迹</h3>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : history.length > 0 ? (
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
              {history.map((record) => (
                <div key={record.id} className="relative pl-8">
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white border-2 border-emerald-500"></div>
                  <div className="mb-1 text-sm font-semibold text-emerald-600">
                    {record.completed_at ? format(new Date(record.completed_at), 'yyyy-MM-dd') : ''}
                  </div>
                  <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-100 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
                    {/* 删除按钮 - 仅在悬停时显示，增大尺寸以适应移动端 */}
                    <button
                      onClick={() => {
                        if (window.confirm('确定要删除这条历史足迹吗？此操作不可恢复。')) {
                          const deleteRecord = async () => {
                            try {
                              // 删除记录的媒体文件
                              if (record.media && record.media.length > 0) {
                                for (const media of record.media) {
                                  try {
                                    // 从存储中删除文件
                                    const filePath = media.url.split('/').slice(-3).join('/')
                                    await dataService.deleteImage(filePath)
                                  } catch (storageError) {
                                    console.error('删除存储文件失败:', storageError)
                                    // 继续执行，不中断整个删除流程
                                  }
                                }
                              }

                              // 删除媒体记录
                              const mediaResult = await dataService.deleteMediaByRecordId(record.id)
                              if (!mediaResult.success) {
                                throw new Error(`删除媒体记录失败: ${mediaResult.error?.message || '未知错误'}`)
                              }

                              // 删除徒步记录
                              const recordResult = await dataService.deleteHikingRecord(record.id)
                              if (!recordResult.success) {
                                throw new Error(`删除徒步记录失败: ${recordResult.error?.message || '未知错误'}`)
                              }

                              // 重新获取数据，确保UI更新
                              await fetchProfileData()
                              showToast('历史足迹已删除', 'success')
                            } catch (error) {
                              console.error('删除过程中发生错误:', error)
                              showToast(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
                            }
                          }
                          deleteRecord()
                        }
                      }}
                      className="absolute top-2 right-2 p-2 w-10 h-10 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 active:text-emerald-600 active:bg-emerald-50 active:border-emerald-200 border border-slate-200 transition-all duration-200 transform scale-0 group-hover:scale-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 z-10 flex items-center justify-center"
                      aria-label="删除历史足迹"
                    >
                      <span className="text-sm font-bold">×</span>
                    </button>
                    
                    {/* 优化布局，在移动端垂直排列 */}
                    <div className="space-y-3 pr-10">
                      <h4 className="text-base sm:text-lg font-bold text-slate-800 group-hover:text-emerald-700 transition-colors leading-tight">{record.routes?.name || '未知路线'}</h4>
                      <div className="flex flex-wrap gap-2">
                        {record.distance && (
                          <span className="text-xs sm:text-sm bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                            徒步路程：{record.distance}km
                          </span>
                        )}
                        {record.duration && (
                          <span className="text-xs sm:text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                            徒步时长：{formatDuration(record.duration)}
                          </span>
                        )}
                      </div>
                      {/* 优化文本可读性，增加行间距 */}
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed break-words">{record.feelings || '未填写心得'}</p>
                      {record.media && record.media.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {record.media.map((m, i) => (
                            <img 
                              key={i} 
                              src={m.url} 
                              className="rounded object-cover aspect-square hover:opacity-90 cursor-pointer transition-transform hover:scale-105 w-full h-full"
                              alt="Record" 
                              referrerPolicy="no-referrer"
                              onClick={() => handleImageClick(record.media.map(media => media.url), i)}
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800">🖼️ 我的相册</h3>
            <button className="text-sm text-emerald-600 font-bold hover:underline">查看全部</button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {recentMedia.length > 0 ? (
              recentMedia.map((media, index) => (
                <img 
                  key={index} 
                  src={media.url} 
                  className="bg-slate-100 rounded object-cover aspect-square cursor-pointer hover:opacity-90 transition-transform hover:scale-105 w-full h-full"
                  alt="Gallery" 
                  referrerPolicy="no-referrer"
                  onClick={() => handleImageClick(allMedia.map(m => m.url), index)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop'
                  }}
                />
              ))
            ) : (
              <div className="col-span-3 sm:col-span-6 bg-slate-50 rounded-lg p-8 flex flex-col items-center justify-center text-slate-400">
                 <p className="text-xs">暂无照片</p>
              </div>
            )}
          </div>
        </div>

        {/* 我的喜欢 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h3 className="text-lg font-bold text-slate-800">我的喜欢</h3>
          </div>
          
          <div className="space-y-3">
            {favorites.length > 0 ? (
              favorites.map((fav) => (
                <div 
                  key={fav.id}
                  onClick={() => fav.routes?.id && navigate(`/routes/${fav.routes.id}`)}
                  className="group flex gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100"
                >
                  {/* Thumbnail */}
                  <div className="w-16 sm:w-20 h-16 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-slate-100">
                    <img 
                      src={(fav.routes?.cover_image_url || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop')} 
                      alt={fav.routes?.name || '路线'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-16 sm:h-20 py-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {fav.routes?.cities && (
                        <span className="shrink-0 inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          {fav.routes.cities.name}
                        </span>
                      )}
                      <h4 className="font-bold text-slate-800 truncate group-hover:text-emerald-600 transition-colors">
                        {fav.routes?.name || '未知路线'}
                      </h4>
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                      <span>全长 {fav.routes?.distance_km || 0}km</span>
                      <span>•</span>
                      <span>预计 {fav.routes?.duration_hours || 0}h</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      收藏于 {format(new Date(fav.created_at), 'yyyy-MM-dd')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-50 rounded-lg p-8 flex flex-col items-center justify-center text-slate-400">
                 <Heart className="w-8 h-8 text-slate-300 mb-2" />
                 <p className="text-sm">暂无收藏路线</p>
                 <button 
                   onClick={() => navigate('/')}
                   className="mt-3 text-xs text-emerald-600 font-medium hover:underline"
                 >
                   去发现路线
                 </button>
              </div>
            )}
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

      <ImagePreviewModal
        isOpen={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        images={previewImages}
        initialIndex={previewInitialIndex}
      />
    </main>
  )
}
