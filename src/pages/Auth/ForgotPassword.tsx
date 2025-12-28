import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mountain, Check, KeyRound, ShieldCheck, Mail } from 'lucide-react'
import { authService } from '../../services/authService'
import clsx from 'clsx'

type Step = 'email' | 'security' | 'reset' | 'success'

export default function ForgotPassword() {
  const [currentStep, setCurrentStep] = useState<Step>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form Data
  const [email, setEmail] = useState('')
  const [securityQuestion, setSecurityQuestion] = useState('')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const { question, error } = await authService.getUserSecurityQuestion(email)
      if (error) throw error
      if (!question) throw new Error('该账号未设置密保问题')
      
      setSecurityQuestion(question)
      setCurrentStep('security')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || '查找账号失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { success, error } = await authService.verifySecurityAnswer(email, securityAnswer)
      if (!success || error) throw error || new Error('密保答案错误')
      
      setCurrentStep('reset')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || '验证失败')
    } finally {
      setLoading(false)
    }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { success, error } = await authService.resetPassword(email, newPassword)
      if (!success || error) throw error || new Error('重置失败')
      
      setCurrentStep('success')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || '重置失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const renderStepIndicator = () => {
    const steps = [
      { id: 'email', icon: Mail },
      { id: 'security', icon: ShieldCheck },
      { id: 'reset', icon: KeyRound },
    ]

    return (
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id
            const isCompleted = ['email', 'security', 'reset', 'success'].indexOf(currentStep) > index
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300",
                  isActive ? "bg-emerald-600 text-white shadow-lg scale-110" : 
                  isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                )}>
                  <step.icon className="w-5 h-5" />
                </div>
                {index < steps.length - 1 && (
                  <div className={clsx(
                    "w-8 h-1 mx-2 rounded-full transition-colors duration-300",
                    isCompleted ? "bg-emerald-200" : "bg-slate-100"
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Link to="/" className="flex items-center gap-2">
            <Mountain className="w-10 h-10 text-emerald-600" />
            <span className="font-bold text-xl text-slate-800">徒步记录</span>
          </Link>
        </div>
        
        {currentStep !== 'success' && renderStepIndicator()}

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm flex items-center gap-2">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {currentStep === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <h2 className="text-center text-xl font-bold text-slate-900 mb-6">找回密码</h2>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  请输入注册邮箱
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="example@email.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                {loading ? <Loader /> : '下一步'}
              </button>
            </form>
          )}

          {currentStep === 'security' && (
            <form onSubmit={handleSecuritySubmit} className="space-y-6 animate-fade-in">
              <h2 className="text-center text-xl font-bold text-slate-900 mb-6">安全验证</h2>
              <div className="bg-emerald-50 p-4 rounded-md text-emerald-800 text-sm mb-4">
                密保问题：<span className="font-bold">{securityQuestion}</span>
              </div>
              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-slate-700">
                  请输入答案
                </label>
                <div className="mt-1">
                  <input
                    id="answer"
                    type="text"
                    required
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="请输入密保答案"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                {loading ? <Loader /> : '验证'}
              </button>
            </form>
          )}

          {currentStep === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-6 animate-fade-in">
              <h2 className="text-center text-xl font-bold text-slate-900 mb-6">重置密码</h2>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">
                  新密码
                </label>
                <div className="mt-1">
                  <input
                    id="newPassword"
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  确认新密码
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                {loading ? <Loader /> : '重置密码'}
              </button>
            </form>
          )}

          {currentStep === 'success' && (
            <div className="text-center animate-zoom-in">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">密码重置成功</h2>
              <p className="text-slate-500 mb-8">
                您的密码已成功更新，请使用新密码登录。
              </p>
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                返回登录
              </Link>
            </div>
          )}
          
          {currentStep !== 'success' && (
            <div className="mt-6 text-center">
               <Link to="/login" className="text-sm font-medium text-emerald-600 hover:text-emerald-500">
                 返回登录
               </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const Loader = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)
