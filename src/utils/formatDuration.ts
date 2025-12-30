/**
 * 格式化时长显示
 * @param duration 时长字符串，可能的格式：
 *   - "2.5h" -> "2小时30分钟"
 *   - "3h" -> "3小时"
 *   - "1.25" -> "1小时15分钟"
 *   - "90min" -> "1小时30分钟"
 *   - "2小时30分钟" -> "2小时30分钟" (已格式化的保持不变)
 */
export function formatDuration(duration: string | null | undefined): string {
  if (!duration) return '未填写'
  
  // 如果已经是中文格式，直接返回
  if (duration.includes('小时') || duration.includes('分钟')) {
    return duration
  }
  
  let totalMinutes = 0
  
  // 处理不同格式
  if (duration.includes('h')) {
    // 格式：2.5h, 3h
    const hours = parseFloat(duration.replace('h', ''))
    totalMinutes = hours * 60
  } else if (duration.includes('min')) {
    // 格式：90min
    totalMinutes = parseFloat(duration.replace('min', ''))
  } else {
    // 纯数字，假设是小时
    const hours = parseFloat(duration)
    if (!isNaN(hours)) {
      totalMinutes = hours * 60
    }
  }
  
  if (totalMinutes === 0) {
    return duration // 无法解析，返回原始值
  }
  
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.round(totalMinutes % 60)
  
  if (hours === 0) {
    return `${minutes}分钟`
  } else if (minutes === 0) {
    return `${hours}小时`
  } else {
    return `${hours}小时${minutes}分钟`
  }
}