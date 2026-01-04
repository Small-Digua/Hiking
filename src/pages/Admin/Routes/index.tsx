import { useState, useEffect } from 'react';
import { adminApi } from '../../../services/admin/api';
import { dataService } from '../../../services/dataService';
import { Search, Plus, Edit2, Trash2, Map } from 'lucide-react';
import RouteModal from './RouteModal';
import { useToast } from '../../../components/Toast';

export default function RouteManagement() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    difficulty: '',
    city_id: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const { showToast } = useToast();

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getRoutes(filters);
      setRoutes(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      showToast('获取路线列表失败: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [filters.page, filters.status, filters.difficulty, filters.city_id]);

  useEffect(() => {
    dataService.getCities().then(({ data }) => {
      if (data) setCities(data);
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchRoutes();
  };

  const handleCreate = async (data: any) => {
    await adminApi.createRoute(data);
    showToast('路线创建成功', 'success');
    fetchRoutes();
  };

  const handleUpdate = async (data: any) => {
    if (!editingRoute) return;
    await adminApi.updateRoute(editingRoute.id, data);
    showToast('路线更新成功', 'success');
    fetchRoutes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该路线吗？')) return;
    try {
      await adminApi.deleteRoute(id);
      showToast('路线删除成功', 'success');
      fetchRoutes();
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
               placeholder="搜索路线名称..."
               value={filters.search}
               onChange={e => setFilters({...filters, search: e.target.value})}
               className="pl-9 pr-4 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500 w-64"
             />
           </form>
           <select
             value={filters.city_id}
             onChange={e => setFilters({...filters, city_id: e.target.value, page: 1})}
             className="px-3 py-2 border border-slate-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
           >
             <option value="">所有城市</option>
             {cities.map(city => (
               <option key={city.id} value={city.id}>{city.name}</option>
             ))}
           </select>
           <select
             value={filters.status}
             onChange={e => setFilters({...filters, status: e.target.value, page: 1})}
             className="px-3 py-2 border border-slate-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
           >
             <option value="">所有状态</option>
             <option value="active">上架</option>
             <option value="offline">下架</option>
           </select>
           <select
             value={filters.difficulty}
             onChange={e => setFilters({...filters, difficulty: e.target.value, page: 1})}
             className="px-3 py-2 border border-slate-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
           >
             <option value="">所有难度</option>
             <option value="1">1</option>
             <option value="2">2</option>
             <option value="3">3</option>
             <option value="4">4</option>
             <option value="5">5</option>
           </select>
        </div>
        <button
          onClick={() => { setEditingRoute(null); setIsModalOpen(true); }}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增路线
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">路线名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">城市</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">加载中...</td></tr>
            ) : routes.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">暂无数据</td></tr>
            ) : (
              routes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded flex items-center justify-center">
                         <Map className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{route.name}</div>
                        <div className="text-xs text-gray-500">难度 {route.difficulty} • {route.duration_hours}h • {route.distance_km}km</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {route.cities?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {route.updated_at ? new Date(route.updated_at).toLocaleDateString('zh-CN') : 
                     route.created_at ? new Date(route.created_at).toLocaleDateString('zh-CN') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      route.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {route.status === 'active' ? '上架' : '下架'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => { setEditingRoute(route); setIsModalOpen(true); }}
                      className="text-emerald-600 hover:text-emerald-900 mr-4"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(route.id)}
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

      <RouteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={editingRoute ? handleUpdate : handleCreate}
        route={editingRoute}
      />
    </div>
  );
}
