import { useState, useEffect } from 'react';
import { adminApi } from '../../../services/admin/api';
import { Search, Plus, Edit2, Trash2, Building2 } from 'lucide-react';
import CityModal from './CityModal';
import { useToast } from '../../../components/Toast';

export default function CityManagement() {
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    district: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<any>(null);
  const { showToast } = useToast();

  const fetchCities = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCities(filters);
      setCities(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      showToast('获取城市列表失败: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, [filters.page, filters.district]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchCities();
  };

  const handleCreate = async (data: any) => {
    await adminApi.createCity(data);
    showToast('城市创建成功', 'success');
    fetchCities();
  };

  const handleUpdate = async (data: any) => {
    if (!editingCity) return;
    await adminApi.updateCity(editingCity.id, data);
    showToast('城市更新成功', 'success');
    fetchCities();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该城市吗？删除后相关路线也将无法访问。')) return;
    try {
      await adminApi.deleteCity(id);
      showToast('城市删除成功', 'success');
      fetchCities();
    } catch (err: any) {
      showToast('删除失败: ' + err.message, 'error');
    }
  };

  // 获取所有独特的区域，用于筛选
  const districts = Array.from(new Set(cities.map(city => city.district || '')).values()).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2">
           <form onSubmit={handleSearch} className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input
               type="text"
               placeholder="搜索城市名称..."
               value={filters.search}
               onChange={e => setFilters({...filters, search: e.target.value})}
               className="pl-9 pr-4 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500 w-64"
             />
           </form>
           <select
             value={filters.district}
             onChange={e => setFilters({...filters, district: e.target.value, page: 1})}
             className="px-3 py-2 border border-slate-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
           >
             <option value="">所有区域</option>
             {districts.map(district => (
               <option key={district} value={district}>{district}</option>
             ))}
           </select>
        </div>
        <button
          onClick={() => { setEditingCity(null); setIsModalOpen(true); }}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增城市
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">城市名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">区域</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center">加载中...</td></tr>
            ) : cities.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">暂无数据</td></tr>
            ) : (
              cities.map((city) => (
                <tr key={city.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded flex items-center justify-center">
                         <Building2 className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{city.name}</div>
                        {city.description && (
                          <div className="text-xs text-gray-500 truncate w-48">{city.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {city.district || '无区域'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {city.created_at ? new Date(city.created_at).toLocaleDateString('zh-CN') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => { setEditingCity(city); setIsModalOpen(true); }}
                      className="text-emerald-600 hover:text-emerald-900 mr-4"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(city.id)}
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

      <CityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={editingCity ? handleUpdate : handleCreate}
        city={editingCity}
      />
    </div>
  );
}
