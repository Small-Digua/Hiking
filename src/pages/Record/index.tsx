import { useState } from 'react'
import { Image as ImageIcon, X } from 'lucide-react'

export default function Record() {
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=200',
  ])

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  return (
    <main className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">记录美好瞬间</h2>
            <p className="text-sm text-slate-500 mt-1">分享您的徒步经历，记录沿途风景。</p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">关联路线</label>
              <select className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2">
                <option>请选择已完成的行程...</option>
                <option>2023-12-30 京西古道</option>
                <option>2023-10-15 东灵山主峰</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">上传照片/视频</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition cursor-pointer">
                <div className="space-y-1 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
                  <div className="flex text-sm text-slate-600 justify-center">
                    <span className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none">上传文件</span>
                    <p className="pl-1">或拖拽文件到此处</p>
                  </div>
                  <p className="text-xs text-slate-500">支持 PNG, JPG, MP4 (最大 50MB)</p>
                </div>
              </div>
              
              <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 group">
                    <img src={img} className="w-full h-full object-cover" alt="Uploaded" />
                    <button 
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 cursor-pointer hover:bg-slate-200 transition">
                  <span className="text-2xl">+</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">心得体会</label>
              <textarea 
                rows={6} 
                className="shadow-sm focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-slate-300 rounded-md border p-3" 
                placeholder="写下您的感受，路况，或者有趣的故事..."
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">保存草稿</button>
              <button className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 shadow-sm shadow-emerald-200">发布记录</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
