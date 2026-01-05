import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Users, Map, LayoutDashboard, LogOut, Mountain, Building2, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import clsx from 'clsx';

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || (data as any)?.role !== 'admin') {
        navigate('/'); // Redirect to home if not admin
      } else {
        setIsAdmin(true);
      }
      setLoading(false);
    };

    checkAdmin();
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  if (!isAdmin) return null;

  const navItems = [
    { path: '/admin', label: '控制台', icon: LayoutDashboard },
    { path: '/admin/users', label: '用户管理', icon: Users },
    { path: '/admin/cities', label: '城市管理', icon: Building2 },
    { path: '/admin/routes', label: '路线管理', icon: Map },
    { path: '/admin/tags', label: '标签管理', icon: Tag },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col fixed h-full">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Mountain className="text-emerald-500 w-6 h-6 mr-2" />
          <span className="font-bold text-lg">徒步后台管理</span>
        </div>
        
        <div className="flex-1 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center px-6 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
             <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                {user?.email?.[0].toUpperCase()}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-medium truncate text-white">{user?.email}</p>
               <p className="text-xs text-slate-500">管理员</p>
             </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-2 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8">
           <h1 className="text-xl font-bold text-slate-800">
             {navItems.find(i => i.path === location.pathname)?.label || '管理系统'}
           </h1>
           <Link to="/" className="text-sm text-emerald-600 hover:underline">返回前台</Link>
        </header>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
