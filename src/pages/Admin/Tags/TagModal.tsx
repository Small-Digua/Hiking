import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { name: string }) => Promise<void>;
  tag: Tag | null;
}

const TagModal: React.FC<TagModalProps> = ({ isOpen, onClose, onConfirm, tag }) => {
  const [formData, setFormData] = useState({
    name: ''
  });
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tag) {
      setFormData({
        name: tag.name
      });
    } else {
      setFormData({
        name: ''
      });
    }
    setErrors({});
  }, [tag, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Validation
    const newErrors: { name?: string } = {};
    if (!formData.name.trim()) {
      newErrors.name = '标签名称不能为空';
    } else if (formData.name.length > 50) {
      newErrors.name = '标签名称不能超过50个字符';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await onConfirm(formData);
      setIsSubmitting(false);
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {tag ? '编辑标签' : '创建标签'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Tag Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                标签名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${errors.name ? 'border-red-500' : 'border-slate-300'}`}
                placeholder="请输入标签名称"
                maxLength={50}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
              <div className="text-xs text-right text-slate-400 mt-1">
                {formData.name.length}/50
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TagModal;
