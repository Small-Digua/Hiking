import { useState, useEffect } from 'react';
import { adminApi } from '../../../services/admin/api';
import { Search, Plus, Edit2, Trash2, Shield, User } from 'lucide-react';
import UserModal from './UserModal';
import { useToast } from '../../../components/Toast';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const { showToast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers(filters);
      setUsers(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      showToast('获取用户列表失败: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters.page, filters.role, filters.status]); // Don't reload on search type, use button or debounce

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 }); // Trigger reload via page reset or need explicit call
    fetchUsers();
  };

  const handleCreate = async (data: any) => {
    await adminApi.createUser(data);
    showToast('用户创建成功', 'success');
    fetchUsers();
  };

  const handleUpdate = async (data: any) => {
    if (!editingUser) return;
    await adminApi.updateUser(editingUser.id, data);
    showToast('用户更新成功', 'success');
    fetchUsers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该用户吗？此操作不可恢复。')) return;
    try {
      await adminApi.deleteUser(id);
      showToast('用户删除成功', 'success');
      fetchUsers();
    } catch (err: any) {
      showToast('删除失败: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2">
           <form onSubmit={handleSearch} className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input
               type="text"
               placeholder="搜索用户名..."
               value={filters.search}
               onChange={e => setFilters({...filters, search: e.target.value})}
               className="pl-9 pr-4 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500 w-64"
             />
           </form>
           <select
             value={filters.role}
             onChange={e => setFilters({...filters, role: e.target.value, page: 1})}
             className="px-3 py-2 border border-slate-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
           >
             <option value="">所有角色</option>
             <option value="user">普通用户</option>
             <option value="admin">管理员</option>
           </select>
           <select
             value={filters.status}
             onChange={e => setFilters({...filters, status: e.target.value, page: 1})}
             className="px-3 py-2 border border-slate-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
           >
             <option value="">所有状态</option>
             <option value="active">启用</option>
             <option value="disabled">禁用</option>
           </select>
        </div>
        <button
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增用户
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">加载中...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">暂无数据</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar_url ? (
                          <img className="h-10 w-10 rounded-full object-cover" src={user.avatar_url} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <User className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : null}
                      {user.role === 'admin' ? '管理员' : '普通用户'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                      className="text-emerald-600 hover:text-emerald-900 mr-4"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
         <div className="text-sm text-gray-700">
           共 {pagination.total} 条数据
         </div>
         <div className="flex gap-2">
           <button
             disabled={filters.page === 1}
             onClick={() => setFilters({...filters, page: filters.page - 1})}
             className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
           >
             上一页
           </button>
           <button
             disabled={filters.page >= pagination.totalPages}
             onClick={() => setFilters({...filters, page: filters.page + 1})}
             className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
           >
             下一页
           </button>
         </div>
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={editingUser ? handleUpdate : handleCreate}
        user={editingUser}
      />
    </div>
  );
}
