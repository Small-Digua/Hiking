import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  user?: any;
}

export default function UserModal({ isOpen, onClose, onSubmit, user }: UserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'user',
    status: 'active',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        username: user.username || user.user_metadata?.username || '',
        password: '', // Password not shown
        role: user.role || 'user',
        status: user.status || 'active',
        phone: user.phone || ''
      });
    } else {
      setFormData({
        email: '',
        username: '',
        password: '',
        role: 'user',
        status: 'active',
        phone: ''
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-slate-800">{user ? '编辑用户' : '新增用户'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">邮箱</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              disabled={!!user} // Email cannot be changed easily in Supabase without reconfirm
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">用户名</label>
            <input
              type="text"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {user ? '新密码 (留空不修改)' : '密码'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              required={!user}
              minLength={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">角色</label>
              <select
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
              <select
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="active">启用</option>
                <option value="disabled">禁用</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">联系方式</label>
            <input
              type="text"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
