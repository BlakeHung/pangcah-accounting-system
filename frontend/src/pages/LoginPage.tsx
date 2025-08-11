import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

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
    username: 'admin',
    password: 'admin123'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

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
        navigate('/dashboard')
      }
    } catch (err: any) {
      console.error('登入失敗:', err)
      if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError('登入失敗，請檢查帳號密碼')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-papa-stone to-papa-cave flex items-center justify-center relative overflow-hidden">
      {/* 部落幾何紋樣背景 */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            rgba(255,255,255,0.1) 0px,
            rgba(255,255,255,0.1) 20px,
            transparent 20px,
            transparent 40px
          ),
          repeating-linear-gradient(
            -45deg,
            rgba(255,255,255,0.05) 0px,
            rgba(255,255,255,0.05) 30px,
            transparent 30px,
            transparent 60px
          )`
        }} />
      </div>
      
      {/* 登入卡片 */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-3xl shadow-papa-deep p-8 backdrop-blur-sm border border-white/20">
          {/* 頭部 - PAPA品牌設計 */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#543622' }}>
              <div className="text-3xl text-white">✦</div>
            </div>
            <h1 className="text-2xl font-bold text-papa-stone mb-2 font-display">
              PAPA
            </h1>
            <p className="text-papa-stone opacity-80 text-sm font-medium">
              Pangcah Accounting Platform
            </p>
            <p className="text-papa-cave opacity-60 text-xs mt-1">
              長光部落記帳系統
            </p>
          </div>
          
          {/* 登入表單 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                ⚠️ {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-papa-stone">
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
                  className="w-full px-4 py-3 pl-12 border border-papa-cave/20 rounded-xl focus:ring-2 focus:ring-papa-ocean focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-papa-cave opacity-40">
                  👤
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-papa-stone">
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
                  className="w-full px-4 py-3 pl-12 border border-papa-cave/20 rounded-xl focus:ring-2 focus:ring-papa-ocean focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-papa-cave opacity-40">
                  🔒
                </div>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none shadow-papa-medium hover:shadow-papa-deep"
              style={{
                background: loading 
                  ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' 
                  : 'linear-gradient(135deg, #E91E63 0%, #AD1457 100%)'
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>登入中...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>🚀</span>
                  <span>進入系統</span>
                </div>
              )}
            </button>
          </form>
          
          {/* 測試帳號資訊 */}
          <div className="mt-8 pt-6 border-t border-papa-cave/10">
            <div className="text-center text-sm text-papa-cave opacity-70">
              <div className="bg-papa-mist rounded-xl p-4">
                <p className="font-medium text-papa-stone mb-2">測試帳號</p>
                <div className="space-y-1 text-xs">
                  <p><span className="font-mono bg-white px-2 py-1 rounded">admin</span> / <span className="font-mono bg-white px-2 py-1 rounded">admin</span> (系統管理員)</p>
                  <p><span className="font-mono bg-white px-2 py-1 rounded">alice</span> / <span className="font-mono bg-white px-2 py-1 rounded">password123</span> (一般用戶)</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* 版權資訊 */}
          <div className="text-center mt-6">
            <p className="text-xs text-papa-cave opacity-50">
              © 2024 長光部落 · 文化與科技的融合
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage