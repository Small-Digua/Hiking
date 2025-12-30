import { useState, useEffect, useRef } from 'react';
import { X, Calendar as CalendarIcon, Upload as UploadIcon, Video as VideoIcon, AlertCircle, Loader2 } from 'lucide-react';
import { zhCN } from 'date-fns/locale';
import { format } from 'date-fns';
import clsx from 'clsx';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { Calendar } from './ui/Calendar';
import { DurationInput } from './ui/DurationInput';
import type { Database } from '../types/database.types';

interface AddHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FileWithPreview {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

type City = Database['public']['Tables']['cities']['Row'];
type Route = Database['public']['Tables']['routes']['Row'] & {
  cities?: City | null;
};

export function AddHistoryModal({ isOpen, onClose, onSuccess }: AddHistoryModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [cities, setCities] = useState<City[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // 表单数据状态（保留城市和路线选择）
  const [formData, setFormData] = useState({
    city_id: '',
    route_id: '',
  });
  
  // 添加CheckInModal的表单状态
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [feelings, setFeelings] = useState('');
  const [distance, setDistance] = useState<string>('0.0');
  const [duration, setDuration] = useState<string>('');
  const [mediaFiles, setMediaFiles] = useState<FileWithPreview[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setFormData({
        city_id: '',
        route_id: '',
      });
      setDate(new Date());
      setFeelings('');
      setDistance('0.0');
      setDuration('');
      setMediaFiles([]);
      setErrorMsg(null);
      setSubmitting(false);
      setShowCalendar(false);
      loadData();
    }
  }, [isOpen]);
  
  // 清理预览URL
  useEffect(() => {
    return () => {
      mediaFiles.forEach(item => URL.revokeObjectURL(item.preview));
    };
  }, [mediaFiles]);
  
  // 加载城市和路线数据
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // 根据选择的城市过滤路线
  useEffect(() => {
    if (formData.city_id) {
      const filtered = routes.filter(route => route.city_id === formData.city_id);
      setFilteredRoutes(filtered);
    } else {
      setFilteredRoutes([]);
    }
    // 清空路线选择
    setFormData(prev => ({ ...prev, route_id: '' }));
  }, [formData.city_id, routes]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 加载城市
      const { data: citiesData, error: citiesError } = await dataService.getCities();
      if (citiesError) throw citiesError;
      setCities(citiesData || []);

      // 加载所有上架的路线
      const { data: routesData, error: routesError } = await dataService.getRoutes({
        status: 'active'
      });
      if (routesError) throw routesError;
      setRoutes(routesData || []);
    } catch (error) {
      console.error('加载数据失败:', error);
      showToast('加载数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 文件处理函数
  const handleFiles = (files: File[]) => {
    setErrorMsg(null);
    const newMediaFiles: FileWithPreview[] = [];

    files.forEach(file => {
      // 验证类型
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        setErrorMsg('仅支持图片(JPG/PNG)和视频(MP4)文件');
        return;
      }

      // 验证大小
      if (isImage && file.size > 5 * 1024 * 1024) {
        setErrorMsg(`图片 ${file.name} 超过5MB限制`);
        return;
      }
      if (isVideo && file.size > 50 * 1024 * 1024) {
        setErrorMsg(`视频 ${file.name} 超过50MB限制`);
        return;
      }

      newMediaFiles.push({
        file,
        preview: URL.createObjectURL(file),
        type: isImage ? 'image' : 'video'
      });
    });

    if (newMediaFiles.length > 0) {
      setMediaFiles(prev => {
        const combined = [...prev, ...newMediaFiles];
        if (combined.length > 9) {
          setErrorMsg('最多只能上传9个文件');
          // 只取前9个
          return combined.slice(0, 9);
        }
        return combined;
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
    // 不立即重置input，确保文件对象在上传前保持有效
    // 重置操作将在关闭模态框时进行
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => {
      const target = prev[index];
      URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const formatDurationText = (dur: string) => {
    if (!dur || dur.trim() === '') return '0分钟';
    return dur; // 直接返回，因为DurationInput已经格式化为"X小时X分钟"
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // 表单验证
    if (!formData.city_id || !formData.route_id || !date || !distance || !duration) {
      showToast('请填写所有必填字段', 'error');
      return;
    }

    // 验证路程
    const distValue = parseFloat(distance);
    if (isNaN(distValue) || distValue < 0.1 || distValue > 100 || !/^\d+(\.\d{1})?$/.test(distance)) {
        setErrorMsg('请输入有效的徒步路程 (0.1-100公里，最多一位小数)');
        return;
    }

    setSubmitting(true);
    try {
      // 1. 创建行程计划（状态为已完成）
      const { data: itinerary, error: itineraryError } = await dataService.createItinerary({
        user_id: user.id,
        route_id: formData.route_id,
        planned_date: date.toISOString().split('T')[0], // 转换为YYYY-MM-DD格式
        status: 'Completed'
      });

      if (itineraryError || !itinerary) {
        throw new Error('创建行程计划失败');
      }

      // 2. 创建徒步记录（关联到行程计划）
      const { data: record, error: recordError } = await dataService.createHikingRecord({
        user_id: user.id,
        route_id: formData.route_id,
        completed_at: date.toISOString(),
        distance: parseFloat(distance),
        duration: duration,
        feelings: feelings || undefined,
        itinerary_id: itinerary.id // 关联到行程计划
      });

      if (recordError || !record) {
        // 如果徒步记录创建失败，删除已创建的行程计划
        await dataService.deleteItinerary(itinerary.id);
        throw new Error('创建徒步记录失败');
      }

      // 3. 保存图片
      if (mediaFiles.length > 0) {
        for (const mediaItem of mediaFiles) {
          try {
            // 先上传文件到存储
            const timestamp = Date.now();
            const fileExt = mediaItem.file.name.split('.').pop();
            const filePath = `${user.id}/hiking_media/${record.id}_${timestamp}.${fileExt}`;
            const url = await dataService.uploadImage(mediaItem.file, filePath);
            
            // 保存媒体记录
            await dataService.createMedia({
              record_id: record.id,
              user_id: user.id,
              type: mediaItem.type === 'image' ? 'Image' : 'Video',
              url: url
            });
          } catch (err) {
            console.error('保存媒体失败:', err);
            // 继续处理其他文件，不中断整个流程
          }
        }
      }

      showToast('历史记录添加成功！', 'success');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('添加历史记录失败:', error);
      showToast(error.message || '添加失败，请重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      city_id: '',
      route_id: '',
    });
    setDate(new Date());
    setFeelings('');
    setDistance('0.0');
    setDuration('');
    setMediaFiles([]);
    setErrorMsg(null);
    setSubmitting(false);
    setShowCalendar(false);
    
    // 重置file input，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[90vw] sm:max-w-md overflow-hidden transform animate-zoom-in relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-0">
          <h2 className="text-xl font-bold text-slate-800">添加历史记录</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full"></div>
              <span className="ml-3 text-slate-600">加载中...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 城市选择 */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  选择城市 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.city_id}
                    onChange={e => setFormData(prev => ({ ...prev, city_id: e.target.value }))}
                    className="w-full appearance-none px-4 py-3 bg-white border-2 border-emerald-500 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-600 transition-all pr-10 cursor-pointer"
                    required
                  >
                    <option value="" className="bg-white text-slate-700 hover:bg-emerald-50 cursor-pointer">请选择城市</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id} className="bg-white text-slate-700 hover:bg-emerald-50 cursor-pointer">{city.name}</option>
                    ))}
                  </select>
                  {/* 自定义下拉箭头 */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-emerald-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* 路线选择 */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  选择路线 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.route_id}
                    onChange={e => setFormData(prev => ({ ...prev, route_id: e.target.value }))}
                    className="w-full appearance-none px-4 py-3 bg-white border-2 border-emerald-500 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-600 transition-all pr-10 cursor-pointer"
                    disabled={!formData.city_id}
                    required
                  >
                    <option value="" className="bg-white text-slate-700 hover:bg-emerald-50 cursor-pointer">请选择路线</option>
                    {filteredRoutes.map(route => (
                      <option key={route.id} value={route.id} className="bg-white text-slate-700 hover:bg-emerald-50 cursor-pointer">
                        {route.name}
                      </option>
                    ))}
                  </select>
                  {/* 自定义下拉箭头 */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-emerald-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
                {formData.city_id && filteredRoutes.length === 0 && (
                  <p className="text-sm text-slate-500 mt-1">该城市暂无可用路线</p>
                )}
              </div>

              {/* 日期选择 */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  徒步日期 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:border-emerald-500 hover:bg-white transition-all"
                  >
                    <span className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-emerald-600" />
                        {date ? format(date, 'yyyy年MM月dd日', { locale: zhCN }) : '选择日期'}
                    </span>
                    <span className="text-xs text-slate-400">点击修改</span>
                  </button>
                  
                  {showCalendar && (
                    <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-slate-100 rounded-2xl shadow-xl animate-zoom-in p-4">
                       <Calendar
                          value={date}
                          onChange={(d) => { setDate(d); setShowCalendar(false); }}
                        />
                    </div>
                  )}
                </div>
              </div>

              {/* 徒步记录模块 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                      徒步路程 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-1">
                        <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="100"
                            value={distance}
                            onChange={(e) => setDistance(e.target.value)}
                            placeholder="0.0"
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                        />
                        <span className="text-sm text-slate-600">km</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                      徒步时长 <span className="text-red-500">*</span>
                    </label>
                    <DurationInput
                      value={duration}
                      onChange={setDuration}
                    />
                </div>
              </div>
              
              {/* 预览提示 */}
              {(distance && duration) && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-emerald-800 flex items-center gap-2 animate-fade-in">
                      <span className="font-bold">预览：</span>
                      徒步 {distance} 公里，耗时 {formatDurationText(duration)}
                  </div>
              )}

              {/* 媒体文件上传 */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 flex justify-between items-center">
                    <span>
                        现场照片/视频
                    </span>
                    <span className="text-slate-400 font-normal text-xs">
                       支持 JPG/PNG/MP4 (最多9个)
                    </span>
                </label>
                
                {/* 拖拽区域 */}
                <div 
                  className={clsx(
                    "relative border-2 border-dashed rounded-xl transition-all duration-200 min-h-[120px]",
                    dragActive ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-slate-50",
                    mediaFiles.length === 0 && "flex flex-col items-center justify-center py-8"
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {mediaFiles.length === 0 ? (
                    <div className="text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                       <div className="bg-white p-3 rounded-full shadow-sm inline-block mb-3">
                          <UploadIcon className="w-6 h-6 text-emerald-500" />
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
                                   <VideoIcon className="w-3 h-3 text-white" />
                                   <span className="text-[10px] text-white">视频</span>
                                </div>
                              )}

                              <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(idx);
                                  }}
                                  className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                              >
                                  <X className="w-3 h-3" />
                              </button>
                          </div>
                       ))}
                       
                       {mediaFiles.length < 9 && (
                          <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                              }}
                              className="aspect-square flex flex-col items-center justify-center bg-white border border-dashed border-slate-300 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                          >
                              <UploadIcon className="w-5 h-5 text-emerald-500 mb-1" />
                              <span className="text-xs text-slate-500">添加</span>
                          </button>
                       )}
                    </div>
                  )}

                  {/* 错误提示 */}
                  {errorMsg && (
                     <div className="absolute -bottom-8 left-0 right-0 flex items-center gap-1.5 text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 animate-fade-in">
                        <AlertCircle className="w-3 h-3" />
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                    取消
                </button>
                <button 
                    type="submit"
                    disabled={!date || submitting}
                    className="flex-1 py-3 text-white font-bold bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : '添加记录'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}