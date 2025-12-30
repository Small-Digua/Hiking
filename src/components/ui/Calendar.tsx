import { useState } from 'react'
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday 
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface CalendarProps {
  value?: Date | null
  onChange?: (date: Date) => void
  className?: string
  maxDate?: Date
}

export function Calendar({ value, onChange, className, maxDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(value || new Date())

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const handleDateClick = (date: Date) => {
    onChange?.(date)
  }

  // 生成日历网格数据
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { locale: zhCN })
  const endDate = endOfWeek(monthEnd, { locale: zhCN })

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  const weekDays = ['一', '二', '三', '四', '五', '六', '日']

  return (
    <div className={clsx("w-full max-w-[320px] bg-white select-none", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <button 
          onClick={handlePrevMonth}
          className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="font-bold text-slate-800 text-lg">
          {format(currentMonth, 'yyyy年 MMMM', { locale: zhCN })}
        </div>

        <button 
          onClick={handleNextMonth}
          className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-slate-400 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-2">
        {calendarDays.map((day) => {
          const isSelected = value ? isSameDay(day, value) : false
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isTodayDate = isToday(day)
          const isDisabled = !isCurrentMonth || (maxDate && day > maxDate)

          return (
            <div key={day.toString()} className="flex justify-center">
              <button
                onClick={() => handleDateClick(day)}
                disabled={isDisabled}
                className={clsx(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-200",
                  // 选中状态 (绿色主题)
                  isSelected && "bg-emerald-500 text-white shadow-md shadow-emerald-200 font-bold transform scale-105",
                  
                  // 未选中但悬停 (仅当月且未禁用)
                  !isSelected && !isDisabled && "hover:bg-emerald-50 hover:text-emerald-600 text-slate-700",
                  
                  // 禁用状态 (非当月或超过最大日期)
                  isDisabled && "text-slate-200 cursor-not-allowed",
                  
                  // 今天 (未选中时显示小点或特殊颜色)
                  !isSelected && isTodayDate && !isDisabled && "text-emerald-600 font-bold bg-emerald-50/50",
                )}
              >
                {format(day, 'd')}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
