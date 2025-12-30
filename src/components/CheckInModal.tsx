import { useState, useRef, useEffect } from 'react'
import { zhCN } from 'date-fns/locale'
import { format } from 'date-fns'
import { X, Upload, Calendar as CalendarIcon, Loader2, Share2, Video, FileVideo, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import { Calendar } from './ui/Calendar'
import { DurationInput } from './ui/DurationInput'

interface CheckInModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: { date: Date; feelings: string; images: File[]; distance: number; duration: string }) => Promise<void>
  routeName: string
}

interface FileWithPreview {
  file: File
  preview: string
  type: 'image' | 'video'
}

export function CheckInModal({ isOpen, onClose, onConfirm, routeName }: CheckInModalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [feelings, setFeelings] = useState('')
  const [distance, setDistance] = useState<string>('0.0')
  const [duration, setDuration] = useState<string>('')
  const [mediaFiles, setMediaFiles] = useState<FileWithPreview[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setStep('form')
      setDate(new Date())
      setFeelings('')
      setDistance('0.0')
      setDuration('')
      setMediaFiles([])
      setErrorMsg(null)
      setIsSubmitting(false)
      setShowCalendar(false)
    }
  }, [isOpen])

  // 清理预览URL
  useEffect(() => {
    return () => {
      mediaFiles.forEach(item => URL.revokeObjectURL(item.preview))
    }
  }, [mediaFiles])

  if (!isOpen) return null

  const handleFiles = (files: File[]) => {
    setErrorMsg(null)
    const newMediaFiles: FileWithPreview[] = []

    files.forEach(file => {
      // 验证类型
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      
      if (!isImage && !isVideo) {
        setErrorMsg('仅支持图片(JPG/PNG)和视频(MP4)文件')
        return
      }

      // 验证大小
      if (isImage && file.size > 5 * 1024 * 1024) {
        setErrorMsg(`图片 ${file.name} 超过5MB限制`)
        return
      }
      if (isVideo && file.size > 50 * 1024 * 1024) {
        setErrorMsg(`视频 ${file.name} 超过50MB限制`)
        return
      }

      newMediaFiles.push({
        file,
        preview: URL.createObjectURL(file),
        type: isImage ? 'image' : 'video'
      })
    })

    if (newMediaFiles.length > 0) {
      setMediaFiles(prev => {
        const combined = [...prev, ...newMediaFiles]
        const result = combined.length > 9 ? combined.slice(0, 9) : combined
        
        // 清理超过9个限制的文件的预览URL
        if (combined.length > 9) {
          for (let i = 9; i < combined.length; i++) {
            URL.revokeObjectURL(combined[i].preview)
          }
        }
        
        return result
      })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
    // 不立即重置input，确保文件对象在上传前保持有效
    // 重置操作将在提交成功后进行
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const removeFile = (index: number) => {
    setMediaFiles(prev => {
      const target = prev[index]
      URL.revokeObjectURL(target.preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async () => {
    if (!date) return
    
    // 验证路程
    const distValue = parseFloat(distance)
    if (isNaN(distValue) || distValue < 0.1 || distValue > 100 || !/^\d+(\.\d{1})?$/.test(distance)) {
        setErrorMsg('请输入有效的徒步路程 (0.1-100公里，最多一位小数)')
        return
    }

    // 验证时长
    if (!duration || duration.trim() === '') {
        setErrorMsg('请输入徒步时长')
        return
    }

    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      // 转换回原始 File 数组传给父组件
      await onConfirm({ 
        date, 
        feelings, 
        images: mediaFiles.map(m => m.file),
        distance: distValue,
        duration
      })
      setStep('success')
      
      // 提交成功后重置input，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error(error)
      // 显示错误信息
      setErrorMsg(error instanceof Error ? error.message : '打卡失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }
  

  const renderForm = () => (
    <div className="p-5 space-y-5">
      {/* 日期选择 */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700">打卡日期 <span className="text-red-500">*</span></label>
        <div className="relative">
          <button 
            onClick={() => setShowCalendar(!showCalendar)}
            className="w-full flex items-center justify-between px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:border-emerald-500 hover:bg-white transition-all"
            aria-label="选择打卡日期"
          >
            <span className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-emerald-600" />
                {date ? format(date, 'yyyy年MM月dd日', { locale: zhCN }) : '选择日期'}
            </span>
            <span className="text-xs text-slate-400">点击修改</span>
          </button>
          
          {showCalendar && (
            <div className="absolute top-full left-0 right-0 mt-2 z-10 bg-white border border-slate-100 rounded-2xl shadow-xl animate-zoom-in p-2 overflow-hidden max-w-full">
               <Calendar
                  value={date}
                  onChange={(d) => { setDate(d); setShowCalendar(false); }}
                  className="max-w-full"
                />
            </div>
          )}
        </div>
      </div>

      {/* 徒步记录模块 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">徒步路程 <span className="text-red-500">*</span></label>
            <div className="flex items-center space-x-1">
                <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    value={distance || undefined}
                    onChange={(e) => setDistance(e.target.value)}
                    placeholder="0.0"
                    className="w-[120px] px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-sans text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all placeholder-black placeholder-opacity-0"
                />
                <span className="text-sm text-slate-600 whitespace-nowrap">km</span>
            </div>
        </div>
        <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">徒步时长 <span className="text-red-500">*</span></label>
            <DurationInput
              value={duration}
              onChange={setDuration}
            />
        </div>
      </div>
      


      {/* 媒体文件上传 */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700 flex justify-between items-center">
            <span>现场照片/视频</span>
            <span className="text-slate-400 font-normal text-xs">
               支持 JPG/PNG/MP4 (最多9个)
            </span>
        </label>
        
        {/* 拖拽区域 */}
        <div 
          className={clsx(
            "relative border-2 border-dashed rounded-xl transition-all duration-200 min-h-[140px]",
            dragActive ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-slate-50",
            mediaFiles.length === 0 && "flex flex-col items-center justify-center py-8"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          aria-label="点击或拖拽上传现场照片/视频"
        >
          {mediaFiles.length === 0 ? (
            <div 
              className="text-center cursor-pointer" 
              onClick={() => fileInputRef.current?.click()}
            >
               <div className="bg-white p-3 rounded-full shadow-sm inline-block mb-3">
                  <Upload className="w-6 h-6 text-emerald-500" />
               </div>
               <p className="text-sm text-slate-600 font-medium">点击或拖拽上传</p>
               <p className="text-xs text-slate-400 mt-1">照片≤5MB，视频≤50MB</p>
            </div>
          ) : (
            <div className="p-3 grid grid-cols-3 gap-3">
               {mediaFiles.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group bg-black"
                    onClick={(e) => e.stopPropagation()}
                  >
                      {item.type === 'video' ? (
                        <video src={item.preview} className="w-full h-full object-cover opacity-80" />
                      ) : (
                        <img src={item.preview} alt="preview" className="w-full h-full object-cover" />
                      )}
                      
                      {/* 类型标识图标 */}
                      {item.type === 'video' && (
                        <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1.5 py-0.5 flex items-center gap-1">
                           <Video className="w-3 h-3 text-white" />
                           <span className="text-[10px] text-white">视频</span>
                        </div>
                      )}

                      <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                          className="absolute top-1 right-1 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                          aria-label="删除媒体文件"
                      >
                          <X className="w-4 h-4" />
                      </button>
                  </div>
               ))}
               
               {mediaFiles.length < 9 && (
                  <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="aspect-square flex flex-col items-center justify-center bg-white border border-dashed border-slate-300 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                  >
                      <Upload className="w-5 h-5 text-emerald-500 mb-1" />
                      <span className="text-xs text-slate-500">添加</span>
                  </button>
               )}
            </div>
          )}

          {/* 错误提示 */}
          {errorMsg && (
             <div className="mt-2 flex items-center gap-1.5 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100 animate-fade-in">
                <AlertCircle className="w-4 h-4" />
                {errorMsg}
             </div>
          )}
        </div>

        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/png, image/jpeg, video/mp4, video/quicktime" 
            multiple 
            onChange={handleFileSelect}
        />
      </div>

      {/* 心得体会 */}
      <div className="space-y-2 pt-2">
        <label className="block text-sm font-bold text-slate-700">
            心得体会
            <span className="text-slate-400 font-normal ml-2 text-xs">({feelings.length}/500字)</span>
        </label>
        <textarea 
            value={feelings}
            onChange={(e) => setFeelings(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="分享一下这次徒步的感受吧..."
            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
        />
      </div>

      <div className="pt-4 flex gap-3">
        <button 
            onClick={onClose}
            className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
        >
            取消
        </button>
        <button 
            onClick={handleSubmit}
            disabled={!date || isSubmitting}
            className="flex-1 py-3 text-white font-bold bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : '确认打卡'}
        </button>
      </div>
    </div>
  )

  const renderSuccess = () => (
    <div className="p-8 text-center animate-zoom-in">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                <Upload className="w-8 h-8 text-white" />
            </div>
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">打卡成功！</h3>
        <p className="text-slate-500 mb-8">恭喜你完成了 <span className="font-bold text-emerald-600">{routeName}</span></p>

        {/* 分享卡片预览区域 */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white mb-8 text-left shadow-xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-emerald-100 text-xs uppercase tracking-wider">HIKING CHECK-IN</p>
                    <h4 className="font-bold text-xl">{routeName}</h4>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                    <span className="font-mono font-bold text-lg">{date ? format(date, 'dd') : ''}</span>
                    <span className="text-xs block text-center">{date ? format(date, 'MMM') : ''}</span>
                </div>
            </div>
            {mediaFiles.length > 0 && (
                <div className="h-32 bg-black/20 rounded-lg mb-4 overflow-hidden relative">
                    {mediaFiles[0].type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-black/40">
                            <FileVideo className="w-8 h-8 text-white/80" />
                        </div>
                    ) : (
                        <img src={mediaFiles[0].preview} className="w-full h-full object-cover" alt="cover" />
                    )}
                    {/* 数量角标 */}
                    {mediaFiles.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                            +{mediaFiles.length - 1}
                        </div>
                    )}
                </div>
            )}
            <p className="text-sm text-emerald-50 line-clamp-3 italic">
                "{feelings || '在大自然中寻找内心的宁静...'}"
            </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                <Share2 className="w-4 h-4" /> 分享
            </button>
            <button 
                onClick={onClose}
                className="py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
            >
                完成
            </button>
        </div>
    </div>
  )

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center p-2 pt-10 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-full sm:max-w-md overflow-hidden transform animate-zoom-in relative mt-2 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'form' && (
            <div className="flex justify-between items-center p-5 pb-0">
                <h3 className="text-xl font-bold text-slate-800">徒步打卡</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="关闭模态框"><X className="w-6 h-6" /></button>
            </div>
        )}
        
        {step === 'form' ? renderForm() : renderSuccess()}
      </div>
    </div>
  )
}
