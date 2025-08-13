import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import Layout from '../components/Layout'

interface User {
  id: number
  username: string
  name: string
  email: string
  role: string
}

interface UserSettings {
  theme: 'light' | 'dark'
  currency: string
  notifications: boolean
}

const Settings: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'system'>('profile')
  const [isMobile, setIsMobile] = useState(false)
  
  // 用戶設定狀態
  const [userSettings, setUserSettings] = useState<UserSettings>({
    theme: 'light',
    currency: 'TWD',
    notifications: true
  })
  
  // 個人資料狀態
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  // 檢查裝置類型
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  // 檢查當前用戶
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      navigate('/login')
      return
    }
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    const user = JSON.parse(userData)
    setCurrentUser(user)
    setProfileForm({
      ...profileForm,
      name: user.name || '',
      email: user.email || ''
    })
  }, [navigate])

  // 獲取用戶設定
  const { data: userSettingsData } = useQuery({
    queryKey: ['user-settings'],
    queryFn: async (): Promise<UserSettings> => {
      try {
        const response = await axios.get('/api/v1/auth/users/me/preferences/')
        return response.data
      } catch (error) {
        console.warn('獲取用戶設定失敗，使用本地設定:', error)
        // 嘗試從 localStorage 獲取
        const saved = localStorage.getItem('user_preferences')
        if (saved) {
          return JSON.parse(saved)
        }
        return userSettings // 返回預設值
      }
    },
    enabled: !!currentUser
  })

  // 更新用戶設定
  const updateUserSettingsMutation = useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      try {
        const response = await axios.patch('/api/v1/auth/users/me/preferences/', data)
        return response.data
      } catch (error) {
        // 如果 API 失敗，先儲存到 localStorage
        console.warn('API 更新失敗，儲存到本地:', error)
        localStorage.setItem('user_preferences', JSON.stringify({ ...userSettings, ...data }))
        return { ...userSettings, ...data }
      }
    },
    onSuccess: (data) => {
      alert('偏好設定已更新')
      // 同時更新 localStorage 作為備份
      localStorage.setItem('user_preferences', JSON.stringify(data))
      queryClient.invalidateQueries({ queryKey: ['user-settings'] })
      
      // 如果是主題變更，立即應用
      if (data.theme) {
        document.documentElement.setAttribute('data-theme', data.theme)
      }
    },
    onError: (error: any) => {
      console.error('偏好設定更新失敗:', error)
      alert('偏好設定更新失敗，請稍後再試')
    }
  })

  // 更新個人資料
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.patch('/api/v1/auth/users/me/', data)
      return response.data
    },
    onSuccess: (data) => {
      alert('個人資料更新成功')
      // 更新本地儲存的用戶資料
      const updatedUser = { ...currentUser, ...data }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setCurrentUser(updatedUser)
      setProfileForm({
        ...profileForm,
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    },
    onError: (error: any) => {
      console.error('個人資料更新失敗:', error)
      // 檢查是否有具體的錯誤訊息
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          '個人資料更新失敗'
      alert(errorMessage)
    }
  })

  // 同步獲取的用戶設定
  useEffect(() => {
    if (userSettingsData) {
      setUserSettings(userSettingsData)
    }
  }, [userSettingsData])

  const handleUserSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateUserSettingsMutation.mutate(userSettings)
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (profileForm.new_password && profileForm.new_password !== profileForm.confirm_password) {
      alert('新密碼與確認密碼不一致')
      return
    }
    
    const updateData: any = {
      name: profileForm.name,
      email: profileForm.email
    }
    
    if (profileForm.new_password) {
      updateData.current_password = profileForm.current_password
      updateData.new_password = profileForm.new_password
    }
    
    updateProfileMutation.mutate(updateData)
  }

  // 應用主題設定
  React.useEffect(() => {
    if (userSettings.theme) {
      document.documentElement.setAttribute('data-theme', userSettings.theme)
    }
  }, [userSettings.theme])

  if (!currentUser) {
    return (
      <Layout user={currentUser}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#2E8B57] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">載入中...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={currentUser}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl p-6 shadow-papa-soft">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
              ⚙️
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">系統設定</h1>
              <p className="text-gray-600 text-sm md:text-base">管理個人資料和系統偏好設定</p>
            </div>
          </div>
        </div>

        {/* 標籤選單 */}
        <div className="bg-white rounded-xl p-2 shadow-papa-soft">
          <div className="flex gap-2 overflow-x-auto">
            <button 
              className={`flex-1 min-w-fit px-4 py-3 rounded-lg transition-all font-medium flex items-center justify-center gap-2 ${
                activeTab === 'profile' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              <span>👤</span>
              <span>個人資料</span>
            </button>
            <button 
              className={`flex-1 min-w-fit px-4 py-3 rounded-lg transition-all font-medium flex items-center justify-center gap-2 ${
                activeTab === 'preferences' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('preferences')}
            >
              <span>🎨</span>
              <span>偏好設定</span>
            </button>
            <button 
              className={`flex-1 min-w-fit px-4 py-3 rounded-lg transition-all font-medium flex items-center justify-center gap-2 ${
                activeTab === 'system' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('system')}
            >
              <span>🔧</span>
              <span>系統管理</span>
            </button>
          </div>
        </div>

        {/* 個人資料設定 */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl p-6 shadow-papa-soft">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2">個人資料</h2>
              <p className="text-gray-600 text-sm">管理您的個人資料和帳戶安全設定</p>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    姓名 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    電子郵件 *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4">密碼變更</h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
                      目前密碼
                    </label>
                    <input
                      type="password"
                      id="current_password"
                      value={profileForm.current_password}
                      onChange={(e) => setProfileForm({...profileForm, current_password: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="若要變更密碼請輸入目前密碼"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                        新密碼
                      </label>
                      <input
                        type="password"
                        id="new_password"
                        value={profileForm.new_password}
                        onChange={(e) => setProfileForm({...profileForm, new_password: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="至少 8 個字元"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                        確認新密碼
                      </label>
                      <input
                        type="password"
                        id="confirm_password"
                        value={profileForm.confirm_password}
                        onChange={(e) => setProfileForm({...profileForm, confirm_password: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="再次輸入新密碼"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="px-6 py-3 bg-[#2E8B57] hover:bg-[#1F5F3F] disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>更新中...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>更新個人資料</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 偏好設定 */}
        {activeTab === 'preferences' && (
          <div className="bg-white rounded-xl p-6 shadow-papa-soft">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2">偏好設定</h2>
              <p className="text-gray-600 text-sm">自訂您的使用體驗偏好</p>
            </div>
            
            <form onSubmit={handleUserSettingsSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
                    介面主題
                  </label>
                  <select
                    id="theme"
                    value={userSettings.theme}
                    onChange={(e) => setUserSettings({...userSettings, theme: e.target.value as 'light' | 'dark'})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                  >
                    <option value="light">☀️ 淺色主題</option>
                    <option value="dark">🌙 深色主題</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">選擇您偏好的介面外觀</p>
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                    預設貨幣顯示
                  </label>
                  <select
                    id="currency"
                    value={userSettings.currency}
                    onChange={(e) => setUserSettings({...userSettings, currency: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                  >
                    <option value="TWD">🇹🇼 新台幣 (NT$)</option>
                    <option value="USD">🇺🇸 美元 ($)</option>
                    <option value="EUR">🇪🇺 歐元 (€)</option>
                    <option value="JPY">🇯🇵 日圓 (¥)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">影響金額顯示格式</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4">通知設定</h3>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userSettings.notifications}
                      onChange={(e) => setUserSettings({...userSettings, notifications: e.target.checked})}
                      className="mt-1 w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">啟用應用內通知</span>
                      <p className="text-xs text-gray-500 mt-1">顯示新活動、支出等通知提醒</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateUserSettingsMutation.isPending}
                  className="px-6 py-3 bg-[#2E8B57] hover:bg-[#1F5F3F] disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  {updateUserSettingsMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>儲存中...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>儲存偏好設定</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 系統管理 */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            {/* 快速導航 - 在行動版顯示不在底部導航的功能 */}
            {(isMobile || currentUser.role === 'ADMIN') && (
              <div className="bg-white rounded-xl p-6 shadow-papa-soft">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">系統功能</h2>
                  <p className="text-gray-600 text-sm">快速存取系統管理功能</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate('/categories')}
                    className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl group-hover:bg-blue-200 transition-colors">
                        🏷️
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">分類管理</h3>
                        <p className="text-sm text-gray-600">管理收支分類項目</p>
                      </div>
                      <div className="text-gray-400 group-hover:text-gray-600">
                        →
                      </div>
                    </div>
                  </button>

                  {currentUser.role === 'ADMIN' && (
                    <button
                      onClick={() => navigate('/users')}
                      className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl group-hover:bg-purple-200 transition-colors">
                          👥
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">用戶管理</h3>
                          <p className="text-sm text-gray-600">管理系統用戶帳號</p>
                        </div>
                        <div className="text-gray-400 group-hover:text-gray-600">
                          →
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => navigate('/activities')}
                    className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-xl group-hover:bg-green-200 transition-colors">
                        🎉
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">活動管理</h3>
                        <p className="text-sm text-gray-600">管理活動和事件</p>
                      </div>
                      <div className="text-gray-400 group-hover:text-gray-600">
                        →
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/groups')}
                    className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-xl group-hover:bg-orange-200 transition-colors">
                        👥
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">群組管理</h3>
                        <p className="text-sm text-gray-600">管理群組和成員</p>
                      </div>
                      <div className="text-gray-400 group-hover:text-gray-600">
                        →
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* 應用資訊 */}
            <div className="bg-white rounded-xl p-6 shadow-papa-soft">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-2">應用資訊</h2>
                <p className="text-gray-600 text-sm">系統和帳號相關資訊</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      📱
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">PAPA 記帳系統</h3>
                      <p className="text-sm text-gray-600">版本 1.0.0</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      👤
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{currentUser.name || currentUser.username}</h3>
                      <p className="text-sm text-gray-600">
                        {currentUser.role === 'ADMIN' ? '系統管理員' : '一般用戶'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      🎨
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">介面主題</h3>
                      <p className="text-sm text-gray-600">
                        {userSettings.theme === 'light' ? '淺色主題' : '深色主題'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      💰
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">貨幣顯示</h3>
                      <p className="text-sm text-gray-600">{userSettings.currency}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 關於系統 */}
            <div className="bg-white rounded-xl p-6 shadow-papa-soft">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl">💼</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Pangcah Accounting System</h3>
                <p className="text-gray-600 text-sm mb-4">專為團體記帳設計的管理系統</p>
                <div className="text-xs text-gray-500">
                  © 2024 PAPA. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Settings