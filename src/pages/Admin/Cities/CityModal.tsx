import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  city?: any;
}

export default function CityModal({ isOpen, onClose, onSubmit, city }: CityModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    district: '',
    description: '',
    image_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (city && isOpen) {
      setFormData({
        name: city.name || '',
        district: city.district || '',
        description: city.description || '',
        image_url: city.image_url || ''
      });
    } else if (!city && isOpen) {
      setFormData({
        name: '',
        district: '',
        description: '',
        image_url: ''
      });
    }
  }, [city, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // 表单验证
    if (!formData.name.trim()) {
      setError('城市名称不能为空');
      setLoading(false);
      return;
    }
    
    // 验证图片URL格式
    if (formData.image_url && !/^https?:\/\/.+/.test(formData.image_url)) {
      setError('请输入有效的图片URL');
      setLoading(false);
      return;
    }
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 sm:p-6 overflow-hidden">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b shrink-0">
          <h2 className="text-lg font-bold text-slate-800">{city ? '编辑城市' : '新增城市'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="city-form" onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded">{error}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* City Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">城市名称</label>
                <input
                  type="text"
                  maxLength={50}
                  value={formData.name}
                  onChange={e => setFormData(prev => ({...prev, name: e.target.value}))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="请输入城市名称"
                  required
                />
                <div className="text-xs text-right text-slate-400 mt-1">{formData.name.length}/50</div>
              </div>
              
              {/* District */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">区域</label>
                <input
                  type="text"
                  maxLength={50}
                  value={formData.district}
                  onChange={e => setFormData(prev => ({...prev, district: e.target.value}))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="请输入区域名称（可选）"
                />
                <div className="text-xs text-right text-slate-400 mt-1">{formData.district.length}/50</div>
              </div>
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">城市描述</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({...prev, description: e.target.value}))}
                className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500 h-24 resize-y"
                placeholder="请输入城市描述（可选）"
              ></textarea>
            </div>
            
            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">城市图片 URL</label>
              <input
                type="text"
                value={formData.image_url}
                onChange={e => setFormData(prev => ({...prev, image_url: e.target.value}))}
                className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="请输入城市图片 URL（可选）"
              />
              <div className="text-xs text-slate-500 mt-1">支持 http/https 格式的图片链接</div>
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md"
          >
            取消
          </button>
          <button
            type="submit"
            form="city-form"
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
