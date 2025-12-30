import { useState, useEffect } from 'react'
import { zhCN } from 'date-fns/locale'
import { format } from 'date-fns'
import { X, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { Calendar } from './ui/Calendar'

interface AddToPlanModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (date: Date) => Promise<void>
  routeName: string
}

export function AddToPlanModal({ isOpen, onClose, onConfirm, routeName }: AddToPlanModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ESC 关闭监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // 禁止背景滚动
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleConfirm = async () => {
    if (!selectedDate) return
    setIsSubmitting(true)
    try {
      await onConfirm(selectedDate)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose} // 点击遮罩关闭
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[90vw] sm:max-w-sm overflow-hidden transform animate-zoom-in relative"
        onClick={(e) => e.stopPropagation()} // 阻止冒泡
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <div className="bg-emerald-100 p-1.5 rounded-lg">
                <CalendarIcon className="w-4 h-4 text-emerald-600" />
            </div>
            加入行程规划
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">
            计划哪天去 <span className="font-bold text-slate-800">{routeName}</span> ？
          </p>
          
          <div className="flex justify-center p-3 mb-4 bg-white">
            <Calendar
              value={selectedDate}
              onChange={setSelectedDate}
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-sm font-medium bg-emerald-50 text-emerald-700 py-2.5 rounded-xl">
            {selectedDate ? (
                <>
                    <span>已选择：</span>
                    <span className="font-bold">{format(selectedDate, 'yyyy年MM月dd日', { locale: zhCN })}</span>
                </>
            ) : (
                <span className="text-slate-400">请选择日期</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex gap-3 justify-end bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition duration-200"
            disabled={isSubmitting}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedDate || isSubmitting}
            className={clsx(
              "px-5 py-2 text-sm font-bold text-white rounded-xl transition duration-200 flex items-center gap-2 shadow-lg shadow-emerald-100",
              !selectedDate || isSubmitting
                ? "bg-slate-300 cursor-not-allowed shadow-none"
                : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200 transform hover:-translate-y-0.5"
            )}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? '保存中...' : '确认加入'}
          </button>
        </div>
      </div>
    </div>
  )
}
