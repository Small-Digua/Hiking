import { CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'

interface CheckInButtonProps {
  status: 'Pending' | 'Completed'
  onClick: () => void
  disabled?: boolean
}

export function CheckInButton({ status, onClick, disabled }: CheckInButtonProps) {
  if (status === 'Completed') {
    return (
      <button
        disabled
        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold cursor-default"
      >
        <CheckCircle2 className="w-4 h-4" />
        已打卡
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-sm active:scale-95",
        "bg-white border border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
      )}
    >
      打卡
    </button>
  )
}
