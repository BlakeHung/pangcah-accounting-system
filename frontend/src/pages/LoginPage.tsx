import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useSnackbar } from '../contexts/SnackbarContext'

interface LoginFormData {
  username: string
  password: string
}

interface LoginResponse {
  access: string
  refresh: string
}

interface ManagedGroup {
  id: number
  name: string
  description: string
}

interface UserProfile {
  id: number
  username: string
  name: string
  email: string
  role: string
  is_active: boolean
  date_joined: string
  last_login?: string
  managed_groups?: ManagedGroup[]
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 步驟1：登入獲取token
      const loginResponse = await axios.post<LoginResponse>('/api/v1/auth/users/login/', formData)
      
      // 儲存 token 到 localStorage
      localStorage.setItem('access_token', loginResponse.data.access)
      localStorage.setItem('refresh_token', loginResponse.data.refresh)
      
      // 設置 axios 預設 headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.access}`
      
      // 步驟2：獲取用戶資料
      try {
        const userResponse = await axios.get<UserProfile>('/api/v1/auth/users/me/')
        
        // 儲存完整的用戶資訊
        const userInfo = {
          id: userResponse.data.id,
          username: userResponse.data.username,
          name: userResponse.data.name || userResponse.data.username,
          email: userResponse.data.email,
          role: userResponse.data.role,
          is_active: userResponse.data.is_active,
          date_joined: userResponse.data.date_joined,
          last_login: userResponse.data.last_login,
          managed_groups: userResponse.data.managed_groups || []
        }
        localStorage.setItem('user', JSON.stringify(userInfo))
        
        console.log('登入成功，用戶資料:', userInfo)
        
        // 更新最後登入時間
        userInfo.last_login = new Date().toISOString()
        localStorage.setItem('user', JSON.stringify(userInfo))
        
        // 顯示歡迎通知
        showSnackbar(`🎉 歡迎回來，${userInfo.name}！`, 'success')
        
        navigate('/dashboard')
      } catch (userErr) {
        console.error('獲取用戶資料失敗:', userErr)
        // 如果獲取用戶資料失敗，使用基本資訊
        const basicUserInfo = {
          username: formData.username,
          name: formData.username,
          role: 'USER' // 預設為一般用戶
        }
        localStorage.setItem('user', JSON.stringify(basicUserInfo))
        showSnackbar(`🎉 歡迎，${basicUserInfo.name}！`, 'success')
        navigate('/dashboard')
      }
    } catch (err: any) {
      console.error('登入失敗:', err)
      let errorMessage = '登入失敗，請檢查帳號密碼'
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
        setError(err.response.data.detail)
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
        setError(err.response.data.message)
      } else {
        setError('登入失敗，請檢查帳號密碼')
      }
      showSnackbar(`❌ ${errorMessage}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F7F4] via-green-50 to-blue-50 flex items-center justify-center relative overflow-hidden">
      {/* 裝飾背景 - 使用 PAPA 色系 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#2E8B57]/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-[#5F9EA0]/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-[#F08080]/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* 登入卡片 */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm">
          {/* 頭部 - PAPA品牌設計 */}
          <div className="text-center mb-8">
            <img 
              src="/logo.png"
              alt="PAPA - Pangcah Accounting" 
              className="w-20 h-20 mx-auto mb-4 rounded-full object-cover shadow-lg"
              onError={(e) => {
                // 備用圖標
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement?.insertAdjacentHTML(
                  'beforeend',
                  '<div class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#2E8B57] to-[#5F9EA0] rounded-full flex items-center justify-center shadow-lg"><span class="text-white text-3xl font-bold">P</span></div>'
                )
              }}
            />
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--papa-earth-brown)' }}>
              PAPA
            </h1>
            <p className="text-gray-600 text-sm font-medium">
              Pangcah Accounting Platform
            </p>
            <p className="text-gray-500 text-xs mt-1">
              長光部落記帳系統
            </p>
          </div>
          
          {/* 登入表單 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                使用者名稱
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  placeholder="請輸入使用者名稱"
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5F9EA0] focus:border-transparent transition-all duration-200"
                  autoComplete="username"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  👤
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密碼
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  placeholder="請輸入密碼"
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5F9EA0] focus:border-transparent transition-all duration-200"
                  autoComplete="current-password"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔒
                </div>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed bg-[#2E8B57] hover:bg-[#1F5F3F]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>登入中...</span>
                </div>
              ) : (
                <span>登入系統</span>
              )}
            </button>
          </form>
          
          {/* 底部資訊 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center text-xs text-gray-500">
              <p className="mb-2">
                © 2025 長光部落記帳系統
              </p>
              <p>
                Powered by{' '}
                <a 
                  href="https://wchung.tw" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium hover:opacity-80 transition-opacity text-[#5F9EA0]"
                >
                  布雷克實驗室 Blake Lab
                </a>
              </p>
              <p className="mt-1">
                <a 
                  href="https://wchung.tw" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600"
                >
                  wchung.tw
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage