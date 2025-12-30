import { useEffect, useState } from 'react';
import { adminApi } from '../../services/admin/api';
import { Users, Map, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    routes: 0,
    activeRoutes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log('开始获取统计数据...');
        
        const [usersRes, routesRes, activeRoutesRes] = await Promise.all([
          adminApi.getUsers({ limit: 1 }),
          adminApi.getRoutes({ limit: 1 }),
          adminApi.getRoutes({ limit: 1, status: 'active' })
        ]);
        
        console.log('统计数据获取成功:', {
          users: usersRes.pagination.total,
          routes: routesRes.pagination.total,
          activeRoutes: activeRoutesRes.pagination.total
        });
        
        setStats({
          users: usersRes.pagination.total,
          routes: routesRes.pagination.total,
          activeRoutes: activeRoutesRes.pagination.total
        });
      } catch (err: any) {
        console.error('获取统计数据失败:', err);
        setError(err.message || '获取数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 animate-pulse">
            <div className="flex items-center">
              <div className="p-4 bg-gray-200 rounded-full mr-4 w-16 h-16"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">获取统计数据失败: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex items-center">
        <div className="p-4 bg-emerald-100 rounded-full text-emerald-600 mr-4">
          <Users className="w-8 h-8" />
        </div>
        <div>
          <p className="text-slate-500 text-sm">总用户数</p>
          <h3 className="text-2xl font-bold text-slate-800">{stats.users}</h3>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex items-center">
        <div className="p-4 bg-blue-100 rounded-full text-blue-600 mr-4">
          <Map className="w-8 h-8" />
        </div>
        <div>
          <p className="text-slate-500 text-sm">总路线数</p>
          <h3 className="text-2xl font-bold text-slate-800">{stats.routes}</h3>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex items-center">
        <div className="p-4 bg-purple-100 rounded-full text-purple-600 mr-4">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div>
          <p className="text-slate-500 text-sm">上架路线</p>
          <h3 className="text-2xl font-bold text-slate-800">{stats.activeRoutes}</h3>
        </div>
      </div>
    </div>
  );
}
