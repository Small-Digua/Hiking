import { useState, useEffect } from 'react';
import { adminApi } from '../../../services/admin/api';
import { Search, Plus, Edit2, Trash2, Tag } from 'lucide-react';
import TagModal from './TagModal';
import { useToast } from '../../../components/Toast';

interface Tag {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TagManagement: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const showToast = useToast();

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getTags({
        search: searchTerm,
        page: pagination.page,
        limit: pagination.limit
      });
      setTags(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      showToast('获取标签列表失败: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [pagination.page, pagination.limit, searchTerm]);

  const handleCreate = async (data: any) => {
    await adminApi.createTag(data);
    showToast('标签创建成功', 'success');
    fetchTags();
    setShowModal(false);
  };

  const handleUpdate = async (data: any) => {
    if (!editingTag) return;
    await adminApi.updateTag(editingTag.id, data);
    showToast('标签更新成功', 'success');
    fetchTags();
    setShowModal(false);
    setEditingTag(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该标签吗？')) return;
    try {
      await adminApi.deleteTag(id);
      showToast('标签删除成功', 'success');
      fetchTags();
    } catch (err: any) {
      showToast('删除失败: ' + err.message, 'error');
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleReset = () => {
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">标签管理</h1>
        <button
          onClick={() => {
            setEditingTag(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增标签
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="搜索标签名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            onClick={handleSearch}
            className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            搜索
          </button>
          {searchTerm && (
            <button
              onClick={handleReset}
              className="bg-slate-200 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-300 transition-colors"
            >
              重置
            </button>
          )}
        </div>
      </div>

      {/* Tags Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                标签名称
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                创建时间
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                更新时间
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  加载中...
                </td>
              </tr>
            ) : tags.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  暂无标签数据
                </td>
              </tr>
            ) : (
              tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded flex items-center justify-center">
                        <Tag className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{tag.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(tag.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(tag.updated_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingTag(tag);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-slate-500">
            共 {pagination.total} 个标签，显示第 {pagination.page} 页，共 {pagination.totalPages} 页
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-slate-300 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="px-3 py-1 border border-slate-300 rounded-md bg-white">
              {pagination.page}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, prev.totalPages) }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border border-slate-300 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <TagModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={editingTag ? handleUpdate : handleCreate}
        tag={editingTag}
      />
    </div>
  );
};

export default TagManagement;
