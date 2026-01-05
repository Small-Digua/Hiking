import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { supabase } from '../../../services/supabase';
import ImageUpload from '../../../components/ui/ImageUpload';
import RatingInput from '../../../components/ui/RatingInput';
import { adminApi } from '../../../services/admin/api';

interface RouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  route?: any;
}

export default function RouteModal({ isOpen, onClose, onSubmit, route }: RouteModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    city_id: '',
    difficulty: 3,
    duration_hours: 1,
    distance_km: 1,
    status: 'active',
    start_point: '',
    end_point: '',
    waypoints: '',
    tags: [] as string[],
    description: '',
    cover_image_url: '',
    images: [] as string[]
  });
  const [cities, setCities] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [tagsLoaded, setTagsLoaded] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      const { data } = await supabase.from('cities').select('id, name');
      if (data) setCities(data);
    };
    fetchCities();
  }, []);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await adminApi.getAllTags();
        setAllTags(tags);
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      } finally {
        setTagsLoaded(true);
      }
    };
    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);

  useEffect(() => {
    if (route && isOpen) {
      // 添加调试日志
      console.log('Loading route data:', route);
      console.log('Route description:', route.description);
      
      setFormData({
        name: route.name || '',
        city_id: route.city_id || '',
        difficulty: route.difficulty || 3,
        duration_hours: route.duration_hours || 1,
        distance_km: route.distance_km || 1,
        status: route.status || 'active',
        start_point: route.start_point || '',
        end_point: route.end_point || '',
        waypoints: route.waypoints || '',
        tags: Array.isArray(route.tags) ? route.tags : [],
        description: route.description || '',
        cover_image_url: route.cover_image_url || '',
        images: route.images || (route.cover_image_url ? [route.cover_image_url] : [])
      });
      setDataLoaded(true);
    } else if (!route && isOpen) {
      setFormData({
        name: '',
        city_id: '',
        difficulty: 3,
        duration_hours: 1,
        distance_km: 1,
        status: 'active',
        start_point: '',
        end_point: '',
        waypoints: '',
        tags: [],
        description: '',
        cover_image_url: '',
        images: []
      });
      setDataLoaded(true);
    } else if (!isOpen) {
      setDataLoaded(false);
    }
  }, [route, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const submitData = {
      ...formData,
      difficulty: Number(formData.difficulty),
      duration_hours: Number(formData.duration_hours),
      distance_km: Number(formData.distance_km),
      // Ensure cover_image_url is always the first image if available
      cover_image_url: formData.images.length > 0 ? formData.images[0] : ''
    };

    try {
      await onSubmit(submitData);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTagChange = (tagId: string) => {
    setFormData(prev => {
      if (prev.tags.includes(tagId)) {
        return {
          ...prev,
          tags: prev.tags.filter(id => id !== tagId)
        };
      } else {
        return {
          ...prev,
          tags: [...prev.tags, tagId]
        };
      }
    });
  };

  // Quill formats and modules
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}], // Remove indentation for now if problematic, or keep if formats are fixed
      [{ 'align': ['', 'center', 'right', 'justify'] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', // 'indent' is usually not needed in formats unless explicitly used in toolbar
    'align',
    'link', 'image'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 sm:p-6 overflow-hidden">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b shrink-0">
          <h2 className="text-lg font-bold text-slate-800">{route ? '编辑路线' : '新增路线'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="route-form" onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded">{error}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-4">
                {/* Image Upload */}
                <ImageUpload 
                   value={formData.images}
                   onChange={(urls) => setFormData(prev => ({
                     ...prev, 
                     images: urls,
                     cover_image_url: urls.length > 0 ? urls[0] : ''
                   }))}
                />

                {/* Route Name */}
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">路线名称</label>
                  <input
                    type="text"
                    maxLength={100}
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="请输入路线名称 (最长100字)"
                    required
                  />
                  <div className="text-xs text-right text-slate-400 mt-1">{formData.name.length}/100</div>
               </div>

               {/* City Selection */}
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">所属城市</label>
                  <select
                    value={formData.city_id}
                    onChange={e => setFormData({...formData, city_id: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="">请选择城市</option>
                    {cities.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
               </div>

               {/* Difficulty Rating */}
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">难度评级</label>
                  <RatingInput 
                    value={formData.difficulty}
                    onChange={(val) => setFormData({...formData, difficulty: val})}
                  />
               </div>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">时长 (小时)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.duration_hours}
                      onChange={e => setFormData(prev => ({...prev, duration_hours: Number(e.target.value)}))}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">距离 (km)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.distance_km}
                      onChange={e => setFormData(prev => ({...prev, distance_km: Number(e.target.value)}))}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">标签选择</label>
                    {tagsLoaded ? (
                      <div className="border rounded-md p-3 h-32 overflow-y-auto">
                        {allTags.length === 0 ? (
                          <div className="text-slate-500 text-sm">暂无标签数据</div>
                        ) : (
                          <div className="space-y-2">
                            {allTags.map(tag => (
                              <div key={tag.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`tag-${tag.id}`}
                                  checked={formData.tags.includes(tag.id)}
                                  onChange={() => handleTagChange(tag.id)}
                                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                                />
                                <label htmlFor={`tag-${tag.id}`} className="ml-2 text-sm text-slate-700">
                                  {tag.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border rounded-md p-3 h-32 flex items-center justify-center text-slate-500">
                        加载标签中...
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData(prev => ({...prev, status: e.target.value}))}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="active">上架</option>
                      <option value="offline">下架</option>
                    </select>
                  </div>
                </div>
            </div>
        </div>

        {/* Rich Text Editor */}
        <div className="h-80 mb-6">
           <label className="block text-sm font-medium text-slate-700 mb-1">
             详细描述
             {route && formData.description && (
               <span className="text-xs text-gray-500 ml-2">
                 ({formData.description.length} 字符)
               </span>
             )}
           </label>
           {dataLoaded ? (
             <ReactQuill 
                key={route?.id || 'new-route'}
                theme="snow"
                value={formData.description}
                onChange={(value) => setFormData(prev => ({...prev, description: value}))}
                modules={modules}
                formats={formats}
                className="h-64"
             />
           ) : (
             <div className="h-64 border rounded-md flex items-center justify-center text-gray-500">
               加载中...
             </div>
           )}
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
            form="route-form"
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
