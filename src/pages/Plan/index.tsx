import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { format, isSameDay } from 'date-fns'
import { Calendar as CalendarIcon, Route, Plus } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext'
import { dataService } from '../../services/dataService'
import { useToast } from '../../components/Toast'
import { CheckInButton } from '../../components/CheckInButton'
import { CheckInModal } from '../../components/CheckInModal'
import { DifficultyStars } from '../../components/DifficultyStars'
import type { Database } from '../../types/database.types'

type Itinerary = Database['public']['Tables']['itineraries']['Row'] & {
  routes?: Database['public']['Tables']['routes']['Row'] | null
}

export default function Plan() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [todos, setTodos] = useState<Itinerary[]>([])
  const [loading, setLoading] = useState(true)
  
  // 打卡 Modal 状态
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false)
  const [currentTodo, setCurrentTodo] = useState<Itinerary | null>(null)

  const loadItineraries = async () => {
    if (!user) return
    setLoading(true)

    const { data, error } = await dataService.getUserItineraries(user.id)
    if (error) {
      console.error('Failed to load itineraries:', error)
      showToast('加载行程失败', 'error')
    } else if (data) {
      setTodos(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (user) {
      loadItineraries()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleCheckInClick = (todo: Itinerary) => {
    setCurrentTodo(todo)
    setIsCheckInModalOpen(true)
  }

  const handleCheckInConfirm = async (data: { date: Date; feelings: string; images: File[]; distance: number; duration: string }) => {
    if (!user || !currentTodo) return

    // 1. 创建打卡记录
    const { data: record, error: recordError } = await dataService.createHikingRecord({
        itinerary_id: currentTodo.id,
        user_id: user.id,
        completed_at: data.date.toISOString(),
        feelings: data.feelings,
        distance: data.distance,
        duration: data.duration
    })

    if (recordError || !record) {
        console.error(recordError)
        showToast('打卡记录保存失败', 'error')
        return
    }

    // 2. 更新行程状态
    const { error: updateError } = await dataService.updateItineraryStatus(currentTodo.id, 'Completed')
    if (updateError) {
        console.error(updateError)
        showToast('行程状态更新失败', 'error')
        return
    }

    // 3. 保存图片 (Mock Upload)
    if (data.images.length > 0) {
        // 在真实场景中，这里应该先上传文件到 Storage，获取 URL，然后保存到 media 表
        // 这里演示只保存记录，URL 使用占位符
        // 并行保存所有图片记录
        await Promise.all(data.images.map((_, index) => 
            dataService.createMedia({
                record_id: record.id,
                user_id: user.id,
                type: 'Image',
                url: `https://source.unsplash.com/random/800x600?hiking,nature&sig=${index}` // Mock URL
            })
        ))
    }

    // 4. 更新本地 UI
    setTodos(todos.map(t => 
        t.id === currentTodo.id ? { ...t, status: 'Completed' } : t
    ))
    
    // Modal 会自动切换到 success 状态，不需要这里手动提示 success toast，因为 Modal 里有
  }

  // 排序逻辑：待完成在前 > 更新时间(创建时间)倒序
  const sortedTodos = [...todos].sort((a, b) => {
    if (a.status !== b.status) {
        return a.status === 'Pending' ? -1 : 1
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <main className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      <CheckInModal 
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        onConfirm={handleCheckInConfirm}
        routeName={currentTodo?.routes?.name || '未知路线'}
      />

      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 min-h-[600px]">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    我的行程计划
                </h2>
                <p className="text-slate-500 mt-1 text-sm">
                    共 {sortedTodos.length} 项安排 · {sortedTodos.filter(t => t.status === 'Completed').length} 项已完成
                </p>
            </div>
            <button 
                onClick={() => navigate('/')}
                className="bg-emerald-600 text-white hover:bg-emerald-700 px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md shadow-emerald-200 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" /> 新建计划
            </button>
          </div>
          
          <div className="space-y-6">
            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-400">正在加载行程...</p>
                </div>
            ) : sortedTodos.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Route className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-slate-600 font-medium mb-1">暂无行程计划</h3>
                    <p className="text-slate-400 text-sm">点击右上角按钮开始规划你的冒险</p>
                </div>
            ) : (
                sortedTodos.map(todo => (
                  <div 
                    key={todo.id} 
                    className={clsx(
                      "flex items-center gap-6 p-6 rounded-2xl border-2 transition-all duration-300 group relative",
                      todo.status === 'Completed' 
                        ? "border-transparent border-l-slate-300 border-l-4 bg-slate-50 opacity-75" 
                        : "border-slate-100 border-l-emerald-500 border-l-4 bg-white hover:border-emerald-100 hover:border-l-emerald-500 hover:shadow-xl hover:-translate-y-1"
                    )}
                  >

                    <div className="flex-grow pl-2">
                      <div className="flex justify-between items-start mb-3">
                        <Link to={`/routes/${todo.route_id}`} className="hover:underline min-w-0">
                            <h4 className={clsx(
                                "font-bold text-xl transition-colors flex items-center gap-2",
                                todo.status === 'Completed' ? "text-slate-400" : "text-slate-800"
                            )}>
                              <span className={clsx("truncate", todo.status === 'Completed' && "line-through")}>
                                {todo.routes?.name || '未知路线'}
                              </span>
                            </h4>
                        </Link>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span className={clsx(
                            "flex items-center px-3 py-1 rounded-full border",
                            isSameDay(new Date(todo.planned_date), new Date()) 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium"
                                : "bg-slate-50 border-slate-200"
                        )}>
                            <CalendarIcon className="w-4 h-4 mr-1.5" />
                            {format(new Date(todo.planned_date), 'yyyy年MM月dd日')}
                        </span>
                        
                        {todo.routes?.distance_km && (
                            <span className="flex items-center bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                                <Route className="w-4 h-4 mr-1.5" />
                                {todo.routes.distance_km} km
                            </span>
                        )}

                        {todo.routes?.difficulty && (
                           <div className="flex items-center bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                             <DifficultyStars level={todo.routes.difficulty} className="flex-shrink-0" />
                           </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 pr-2">
                        <CheckInButton 
                            status={todo.status} 
                            onClick={() => handleCheckInClick(todo)}
                        />
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
