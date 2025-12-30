import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { format, isSameDay } from 'date-fns'
import { Calendar as CalendarIcon, Route, Plus, AlertTriangle, Loader2, History } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext'
import { dataService } from '../../services/dataService'
import { useToast } from '../../components/Toast'
import { CheckInButton } from '../../components/CheckInButton'
import { CheckInModal } from '../../components/CheckInModal'

import { AddHistoryModal } from '../../components/AddHistoryModal'
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

  // 删除 Modal 状态
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [todoToDelete, setTodoToDelete] = useState<Itinerary | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 添加历史记录 Modal 状态
  const [isAddHistoryModalOpen, setIsAddHistoryModalOpen] = useState(false)

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

  const handleDeleteClick = (todo: Itinerary) => {
    setTodoToDelete(todo)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!todoToDelete) return
    
    setIsDeleting(true)
    const { error } = await dataService.deleteItinerary(todoToDelete.id)
    setIsDeleting(false)

    if (error) {
      console.error('Failed to delete itinerary:', error)
      showToast('删除失败，请重试', 'error')
    } else {
      setTodos(todos.filter(t => t.id !== todoToDelete.id))
      showToast('行程已删除', 'success')
      setIsDeleteModalOpen(false)
      setTodoToDelete(null)
    }
  }

  const handleAddHistorySuccess = () => {
    // 添加历史记录成功后，刷新行程列表
    loadItineraries()
    showToast('历史记录添加成功！', 'success')
  }

  const handleCheckInConfirm = async (data: { date: Date; feelings: string; images: File[]; distance: number; duration: string }) => {
    if (!user || !currentTodo) {
      throw new Error('用户或行程信息缺失')
    }

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
        throw new Error('打卡记录保存失败')
    }

    // 2. 更新行程状态
    const { error: updateError } = await dataService.updateItineraryStatus(currentTodo.id, 'Completed')
    if (updateError) {
        console.error(updateError)
        throw new Error('行程状态更新失败')
    }

    // 3. 保存图片 (真实上传)
    if (data.images.length > 0) {
        // 上传文件到 Supabase Storage
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
    <main className="bg-slate-50 min-h-screen">
      <AddHistoryModal 
        isOpen={isAddHistoryModalOpen}
        onClose={() => setIsAddHistoryModalOpen(false)}
        onSuccess={handleAddHistorySuccess}
      />

      <CheckInModal 
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        onConfirm={handleCheckInConfirm}
        routeName={currentTodo?.routes?.name || '未知路线'}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">确认删除行程？</h3>
              <p className="text-slate-500 text-sm mb-6">
                确定要取消前往 <span className="font-bold text-slate-800">{todoToDelete?.routes?.name}</span> 的计划吗？
              </p>
              <div className="flex gap-3 w-full">
                 <button
                   onClick={() => setIsDeleteModalOpen(false)}
                   disabled={isDeleting}
                   className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   取消
                 </button>
                 <button
                   onClick={confirmDelete}
                   disabled={isDeleting}
                   className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm shadow-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                 >
                   {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                   {isDeleting ? '删除中...' : '确认删除'}
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="py-8 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                    我的行程计划
                </h2>
                <p className="text-slate-500 mt-1 text-sm">
                    共 {sortedTodos.length} 项安排 · {sortedTodos.filter(t => t.status === 'Completed').length} 项已完成
                </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button 
                  onClick={() => navigate('/')}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> 新建计划
              </button>
              <button 
                  onClick={() => setIsAddHistoryModalOpen(true)}
                  className="bg-slate-100 text-slate-800 hover:bg-slate-200 px-4 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <History className="w-4 h-4" /> 添加历史记录
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {loading ? (
                <div className="text-center py-16">
                    <div className="animate-spin w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-400">正在加载行程...</p>
                </div>
            ) : sortedTodos.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <Route className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-slate-600 font-medium mb-1">暂无行程计划</h3>
                    <p className="text-slate-400 text-sm">点击上方按钮开始规划你的冒险</p>
                </div>
            ) : (
                sortedTodos.map(todo => (
                  <div 
                    key={todo.id} 
                    className={clsx(
                      "p-4 rounded-2xl border transition-all duration-300 group relative bg-white shadow-sm overflow-hidden",
                      todo.status === 'Completed' 
                        ? "border-slate-200 bg-slate-50 opacity-80" 
                        : "border-slate-200 hover:border-emerald-200 hover:shadow-xl hover:-translate-y-1"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <Link to={`/routes/${todo.route_id}`} className="hover:underline flex-grow min-w-0">
                          <h4 className={clsx(
                              "font-bold text-lg transition-colors flex items-center gap-2",
                              todo.status === 'Completed' ? "text-slate-400" : "text-slate-800"
                          )}>
                            <span className={clsx("truncate", todo.status === 'Completed' && "line-through")}>
                              {todo.routes?.name || '未知路线'}
                            </span>
                          </h4>
                      </Link>
                      
                      {/* 删除按钮 - 右上角悬浮显示 */}
                      <button
                          onClick={() => handleDeleteClick(todo)}
                          className="p-1.5 w-8 h-8 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 active:text-emerald-600 active:bg-emerald-50 active:border-emerald-200 border border-slate-200 transition-all duration-200 transform scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 z-10 flex items-center justify-center"
                          aria-label="删除行程"
                      >
                          <span className="text-sm font-bold">×</span>
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mb-4">
                      <span className="flex items-center px-3 py-2 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
                          <CalendarIcon className="w-4 h-4 mr-1.5" />
                          {format(new Date(todo.planned_date), 'yyyy年MM月dd日')}
                      </span>
                      
                      {todo.routes?.distance_km && (
                          <span className="flex items-center px-3 py-2 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
                              <Route className="w-4 h-4 mr-1.5" />
                              {todo.routes.distance_km} km
                          </span>
                      )}


                    </div>
                    
                    <div className="flex justify-end">
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
