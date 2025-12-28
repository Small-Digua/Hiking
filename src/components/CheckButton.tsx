import { Check } from 'lucide-react'
import clsx from 'clsx'
import { useState } from 'react'

interface CheckButtonProps {
  checked: boolean
  onClick: () => void
  disabled?: boolean
}

export function CheckButton({ checked, onClick, disabled }: CheckButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = () => {
    if (disabled) return
    setIsAnimating(true)
    onClick()
    setTimeout(() => setIsAnimating(false), 300)
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={clsx(
        "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 border-2",
        "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
        checked
          ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200"
          : "bg-white border-slate-200 text-transparent hover:border-emerald-300 hover:bg-slate-50",
        isAnimating && "scale-90"
      )}
      aria-label={checked ? "标记为未完成" : "标记为已完成"}
    >
      <Check 
        className={clsx(
          "w-6 h-6 transition-all duration-300",
          checked ? "opacity-100 scale-100" : "opacity-0 scale-50"
        )} 
        strokeWidth={3}
      />
    </button>
  )
}
