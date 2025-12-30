import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useToast } from '../Toast';

interface ImageUploadProps {
  value: string[]; // Changed to array of strings
  onChange: (urls: string[]) => void;
  maxCount?: number;
}

export default function ImageUpload({ value = [], onChange, maxCount = 9 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Check count limit
    if (value.length + files.length > maxCount) {
      showToast(`最多只能上传 ${maxCount} 张图片`, 'error');
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate type
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
          showToast(`文件 ${file.name} 格式不支持，仅支持 JPG/PNG`, 'error');
          continue;
        }

        // Validate size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          showToast(`文件 ${file.name} 大小超过 5MB`, 'error');
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `route-covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('hiking_assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('hiking_assets').getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
      }

      if (newUrls.length > 0) {
        onChange([...value, ...newUrls]);
        showToast(`成功上传 ${newUrls.length} 张图片`, 'success');
      }
    } catch (error: any) {
      showToast('上传失败: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    const newValue = [...value];
    const [item] = newValue.splice(index, 1);
    newValue.unshift(item); // Move to first position
    onChange(newValue);
    showToast('已设为封面', 'success');
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
    if (e.dataTransfer.files) {
      handleUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        路线图片 ({value.length}/{maxCount})
        <span className="text-xs text-slate-400 ml-2 font-normal">第一张图片将作为封面首图</span>
      </label>
      
      {/* Gallery Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-4">
          {value.map((url, index) => (
            <div key={url} className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
              <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
              
              {/* Cover Badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-emerald-600 text-white text-xs px-2 py-0.5 rounded shadow">
                  封面
                </div>
              )}

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetCover(index)}
                    className="bg-white text-emerald-600 px-3 py-1 rounded-full text-xs font-medium hover:bg-emerald-50 transition"
                  >
                    设为封面
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="bg-white text-red-600 p-1.5 rounded-full hover:bg-red-50 transition"
                  title="删除图片"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {value.length < maxCount && (
        <div
          className={`relative w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer
            ${dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 bg-slate-50'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png"
            multiple // Allow multiple selection
            onChange={(e) => handleUpload(e.target.files)}
          />
          
          {uploading ? (
             <div className="text-emerald-600 flex flex-col items-center">
               <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mb-2"></div>
               <span className="text-sm">上传中...</span>
             </div>
          ) : (
            <>
              <div className="flex flex-col items-center">
                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                <p className="text-sm text-slate-600">点击或拖拽上传</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
