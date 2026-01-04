import { useState, useEffect } from 'react'
import { X, User, Lock, Check, Loader2, Save, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import { dataService } from '../services/dataService'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdateUser: () => void
}

const AVATARS = [
  '/avatars/avatar_custom_01.png',
  '/avatars/avatar_custom_02.png',
  '/avatars/avatar_custom_03.png',
  '/avatars/avatar_custom_04.png',
  '/avatars/avatar_custom_05.png',
  '/avatars/avatar_custom_06.png',
  '/avatars/avatar_custom_07.png',
  '/avatars/avatar_01.png',
  '/avatars/avatar_02.png',
  '/avatars/avatar_03.png',
  '/avatars/avatar_04.png',
  '/avatars/avatar_05.png',
  '/avatars/avatar_06.png',
  '/avatars/avatar_07.png'
]

const SECURITY_QUESTIONS = [
  '您的星座是？'
]

// 简单的混淆加密 (仅作演示，实际生产应使用更强的加密)
const simpleEncrypt = (text: string) => {
  return btoa(encodeURIComponent(text)).split('').reverse().join('')
}

export function SettingsModal({ isOpen, onClose, onUpdateUser }: SettingsModalProps) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
  const [loading, setLoading] = useState(false)

  // Profile States
  const [username, setUsername] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')



  // Security States
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0])
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      setUsername(user.user_metadata.username || '')
      setSelectedAvatar(user.user_metadata.avatar_url || '')
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, user])



  const handleSaveProfile = async () => {
    if (!user) return
    if (!username.trim()) {
      showToast('用户名不能为空', 'error')
      return
    }

    setLoading(true)
    try {
      const { error } = await dataService.updateUserProfile(user.id, {
        username: username.trim(),
        avatar_url: selectedAvatar
      })

      if (error) throw error
      
      // 成功后：Toast提示 + 立即关闭
      showToast('修改成功', 'success')
      onUpdateUser() // 触发父组件数据更新
      onClose()
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err)
      // 区分不同类型的错误
      if (err.message?.includes('超时')) {
        showToast('请求超时，请检查网络连接', 'error')
      } else {
        showToast('修改失败，请重试', 'error')
      }
      // 失败时保持弹窗开启，无需额外操作，loading 会在 finally 中解除
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSecurity = async () => {
    if (!securityAnswer.trim()) {
      showToast('密保答案不能为空', 'error')
      setConfirmModalOpen(false)
      return
    }

    setLoading(true)
    try {
      const encryptedAnswer = simpleEncrypt(securityAnswer.trim())
      const { error } = await dataService.updateUserSecurity({
        question: securityQuestion,
        answer: encryptedAnswer
      })

      if (error) throw error

      showToast('密保设置已保存', 'success')
      setConfirmModalOpen(false)
      setSecurityAnswer('') // 清空敏感信息
    } catch (err) {
      console.error(err)
      showToast('保存失败，请重试', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800">设置</h3>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab('profile')}
              className={clsx(
                "flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2",
                activeTab === 'profile' 
                  ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <User className="w-4 h-4" /> 基本资料
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={clsx(
                "flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2",
                activeTab === 'security' 
                  ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <Lock className="w-4 h-4" /> 密保设置
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {activeTab === 'profile' ? (
              <div className="space-y-6">
                {/* Username Input */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    昵称
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        if (e.target.value.length <= 15) {
                          setUsername(e.target.value)
                        }
                      }}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pr-12"
                      placeholder="请输入昵称"
                    />
                    <span className={clsx(
                      "absolute right-3 top-1/2 -translate-y-1/2 text-xs",
                      username.length >= 15 ? "text-red-500 font-bold" : "text-slate-400"
                    )}>
                      {username.length}/15
                    </span>
                  </div>
                </div>

                {/* Avatar Selection */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    选择头像
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {AVATARS.map((url, index) => (
                      <div 
                        key={index}
                        onClick={() => setSelectedAvatar(url)}
                        className={clsx(
                          "aspect-square rounded-xl cursor-pointer overflow-hidden border-2 transition-all relative group",
                          selectedAvatar === url 
                            ? "border-emerald-500 ring-2 ring-emerald-100" 
                            : "border-transparent hover:border-slate-200 bg-slate-50"
                        )}
                      >
                        <img 
                          src={url} 
                          alt={`Avatar ${index + 1}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {selectedAvatar === url && (
                          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                            <div className="bg-emerald-500 text-white rounded-full p-0.5">
                              <Check className="w-3 h-3" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  保存修改
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800 flex gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
                  <p>密保问题将用于找回账号或验证身份，请务必牢记您的答案。</p>
                </div>

                {/* Question Select */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    密保问题
                  </label>
                  <select
                    value={securityQuestion}
                    onChange={(e) => setSecurityQuestion(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {SECURITY_QUESTIONS.map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>

                {/* Answer Input */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    答案
                  </label>
                  <input
                    type="text"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="请输入答案"
                  />
                </div>

                <button
                  onClick={() => setConfirmModalOpen(true)}
                  disabled={loading || !securityAnswer.trim()}
                  className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  保存设置
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-zoom-in">
            <h4 className="text-lg font-bold text-slate-800 mb-2">确认保存密保？</h4>
            <p className="text-slate-600 mb-6 text-sm">
              请确保您已记住该答案，保存后将加密存储至云端。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveSecurity}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors"
              >
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
