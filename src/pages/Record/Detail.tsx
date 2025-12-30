import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowLeft, Star, Clock, MapPin } from 'lucide-react'
import { dataService } from '../../services/dataService'

// 定义记录类型
interface Media {
  id: string
  url: string
  created_at: string
}

interface HikingRecord {
  id: string
  user_id: string
  itinerary_id: string
  route_id: string
  completed_at: string
  feelings: string
  distance: number
  duration: string
  created_at: string
  updated_at: string
  media: Media[]
  routes: {
    id: string
    name: string
    difficulty: number
    duration_hours: number
    distance_km: number
    city_id: string
    cities: {
      name: string
    }
  }
}

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [record, setRecord] = useState<HikingRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // 获取记录详情
  useEffect(() => {
    const fetchRecordDetail = async () => {
      if (!id) {
        setError('记录ID不存在')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        // 获取所有记录
        const records = await dataService.getRecords()
        const foundRecord = records.find(r => r.id === id)
        
        if (foundRecord) {
          // 转换数据结构，确保路线信息在routes属性中（复数）
          const transformedRecord = {
            ...foundRecord,
            routes: foundRecord.route || foundRecord.routes || null
          }
          setRecord(transformedRecord)
        } else {
          setError('记录不存在')
        }
      } catch (err) {
        console.error('获取记录详情失败:', err)
        setError('获取记录详情失败')
      } finally {
        setLoading(false)
      }
    }

    fetchRecordDetail()
  }, [id])

  // 切换到上一张照片
  const handlePrevImage = () => {
    if (!record || record.media.length <= 1) return
    setCurrentImageIndex(prev => (prev === 0 ? record.media.length - 1 : prev - 1))
  }

  // 切换到下一张照片
  const handleNextImage = () => {
    if (!record || record.media.length <= 1) return
    setCurrentImageIndex(prev => (prev === record.media.length - 1 ? 0 : prev + 1))
  }

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevImage()
      } else if (e.key === 'ArrowRight') {
        handleNextImage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [record, handlePrevImage, handleNextImage])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-slate-600">加载记录详情中...</p>
        </div>
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">{error || '记录不存在'}</h2>
          <button
            onClick={() => navigate('/profile')}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            返回历史足迹
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 主视觉区域 */}
      <div className="relative w-full h-[60vh] bg-white overflow-hidden">
        {/* 返回按钮 */}
        <Link
          to="/profile"
          className="absolute top-4 left-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </Link>

        {/* 照片展示 */}
        <div className="relative w-full h-full bg-slate-100">
          {record.media.length > 0 ? (
            <div className="relative w-full h-full">
              {/* 当前照片 */}
              <img
                src={record.media[currentImageIndex].url}
                alt={`徒步记录 ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />

              {/* 照片指示器 */}
              {record.media.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {record.media.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-white w-6' : 'bg-white/60'}`}
                      aria-label={`跳转到第 ${index + 1} 张照片`}
                    />
                  ))}
                </div>
              )}

              {/* 导航箭头 */}
              {record.media.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur-sm transition-colors"
                    aria-label="上一张"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur-sm transition-colors"
                    aria-label="下一张"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-slate-100">
              <p className="text-slate-400">暂无照片</p>
            </div>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 路线名称 */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">{record.routes?.name || '未知路线'}</h1>
        
        {/* 路线基本信息 */}
        <div className="flex flex-wrap gap-6 mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>难度 {record.routes?.difficulty ? record.routes.difficulty : '暂无数据'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>预计 {record.routes?.duration_hours ? `${record.routes.duration_hours}小时` : '暂无数据'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span>路程 {record.routes?.distance_km ? `${record.routes.distance_km} km` : '暂无数据'}</span>
          </div>
        </div>

        {/* 路线核心概览 */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-amber-500">★</span>
            一、路线核心概览
          </h2>
          <div className="text-slate-700 leading-relaxed space-y-4">
            <p className="text-slate-600">
              作为徒步路线，{record.routes?.name || '该路线'}提供了丰富的自然景观和徒步体验。
              这条路线适合喜欢户外活动的爱好者，沿途可以欣赏到美丽的自然风光。
            </p>
          </div>
        </div>

        {/* 记录详情 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">记录详情</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {/* 打卡时间 */}
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <div className="text-slate-500 text-xs mb-1">打卡时间</div>
              <div className="text-slate-800 font-medium">{new Date(record.completed_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            
            {/* 徒步路程 */}
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <div className="text-slate-500 text-xs mb-1">徒步路程</div>
              <div className="text-slate-800 font-medium">{record.distance ? `${record.distance} km` : '暂无数据'}</div>
            </div>
            
            {/* 徒步时长 */}
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <div className="text-slate-500 text-xs mb-1">徒步时长</div>
              <div className="text-slate-800 font-medium">{record.duration || '暂无数据'}</div>
            </div>
          </div>
        </div>

        {/* 徒步心得 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">徒步心得</h2>
          <div className="text-slate-700 leading-relaxed space-y-4">
            {record.feelings ? (
              <div className="whitespace-pre-wrap">{record.feelings}</div>
            ) : (
              <div className="text-slate-400 italic">用户未填写心得</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}