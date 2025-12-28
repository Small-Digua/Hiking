import { Star } from 'lucide-react'
import clsx from 'clsx'

interface DifficultyStarsProps {
  level: number
  className?: string
}

export function DifficultyStars({ level, className }: DifficultyStarsProps) {
  // 确保等级在 1-5 之间
  const clampedLevel = Math.max(1, Math.min(5, Math.round(level)))
  
  const difficultyConfig: Record<number, { label: string; desc: string }> = {
    1: { label: '1星', desc: '休闲 - 地势平坦，适合所有年龄段' },
    2: { label: '2星', desc: '入门 - 路程较短，有少量爬升' },
    3: { label: '3星', desc: '进阶 - 路程适中，地形有一定起伏' },
    4: { label: '4星', desc: '挑战 - 路程较长，地形复杂，需体能储备' },
    5: { label: '5星', desc: '极限 - 极具挑战，需专业装备和丰富经验' }
  }

  const currentConfig = difficultyConfig[clampedLevel] || difficultyConfig[1]

  return (
    <div 
      className={clsx("flex items-center gap-1.5 relative group/stars cursor-help select-none", className)}
      aria-label={`难度等级：${clampedLevel}星 - ${currentConfig.desc}`}
    >
      <span className="text-sm text-slate-500 font-medium hidden sm:inline-block">
        难度
      </span>
      
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star 
                key={star} 
                className={clsx(
                    "w-4 h-4 transition-transform duration-300", 
                    star <= clampedLevel 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "fill-slate-100 text-slate-300",
                    // 悬停动画：依次放大效果或整体放大
                    "group-hover/stars:scale-110" 
                )} 
            />
        ))}
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover/stars:opacity-100 group-hover/stars:visible transition-all duration-200 transform translate-y-1 group-hover/stars:translate-y-0 z-50 shadow-xl text-center">
        <div className="font-bold mb-0.5 text-yellow-400">难度等级 {clampedLevel}</div>
        <div className="text-slate-200">{currentConfig.desc}</div>
        
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  )
}
