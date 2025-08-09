import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import Layout from '../components/Layout'
import './Settings.css'

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
  const [activeTab, setActiveTab] = useState<'preferences' | 'profile'>('profile')
  
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
        <div className="loading">載入中...</div>
      </Layout>
    )
  }

  return (
    <Layout user={currentUser}>
      <div className="settings-container">
        <div className="settings-header">
          <h1>⚙️ 系統設定</h1>
        </div>

        {/* 標籤選單 */}
        <div className="settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 個人資料
          </button>
          <button 
            className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            ⚙️ 偏好設定
          </button>
        </div>

        {/* 個人資料設定 */}
        {activeTab === 'profile' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>個人資料</h2>
              <p>管理您的個人資料和帳戶安全設定</p>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="settings-form">
              <div className="form-group">
                <label htmlFor="name">姓名 *</label>
                <input
                  type="text"
                  id="name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">電子郵件 *</label>
                <input
                  type="email"
                  id="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                  required
                />
              </div>

              <div className="form-divider">
                <span>密碼變更</span>
              </div>

              <div className="form-group">
                <label htmlFor="current_password">目前密碼</label>
                <input
                  type="password"
                  id="current_password"
                  value={profileForm.current_password}
                  onChange={(e) => setProfileForm({...profileForm, current_password: e.target.value})}
                  placeholder="若要變更密碼請輸入目前密碼"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="new_password">新密碼</label>
                  <input
                    type="password"
                    id="new_password"
                    value={profileForm.new_password}
                    onChange={(e) => setProfileForm({...profileForm, new_password: e.target.value})}
                    placeholder="至少 8 個字元"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirm_password">確認新密碼</label>
                  <input
                    type="password"
                    id="confirm_password"
                    value={profileForm.confirm_password}
                    onChange={(e) => setProfileForm({...profileForm, confirm_password: e.target.value})}
                    placeholder="再次輸入新密碼"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? '更新中...' : '更新個人資料'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 偏好設定 */}
        {activeTab === 'preferences' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>偏好設定</h2>
              <p>自訂您的使用體驗偏好</p>
            </div>
            
            <form onSubmit={handleUserSettingsSubmit} className="settings-form">
              <div className="form-group">
                <label htmlFor="theme">介面主題</label>
                <select
                  id="theme"
                  value={userSettings.theme}
                  onChange={(e) => setUserSettings({...userSettings, theme: e.target.value as 'light' | 'dark'})}
                >
                  <option value="light">淺色主題</option>
                  <option value="dark">深色主題</option>
                </select>
                <small className="form-hint">選擇您偏好的介面外觀</small>
              </div>

              <div className="form-group">
                <label htmlFor="currency">預設貨幣顯示</label>
                <select
                  id="currency"
                  value={userSettings.currency}
                  onChange={(e) => setUserSettings({...userSettings, currency: e.target.value})}
                >
                  <option value="TWD">新台幣 (NT$)</option>
                  <option value="USD">美元 ($)</option>
                  <option value="EUR">歐元 (€)</option>
                  <option value="JPY">日圓 (¥)</option>
                </select>
                <small className="form-hint">影響金額顯示格式</small>
              </div>

              <div className="form-divider">
                <span>通知設定</span>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={userSettings.notifications}
                    onChange={(e) => setUserSettings({...userSettings, notifications: e.target.checked})}
                  />
                  <span className="checkbox-text">啟用應用內通知</span>
                </label>
                <small className="form-hint">顯示新活動、支出等通知提醒</small>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={updateUserSettingsMutation.isPending}
                >
                  {updateUserSettingsMutation.isPending ? '儲存中...' : '儲存偏好設定'}
                </button>
              </div>
            </form>
          </div>
        )}


        {/* 應用資訊 */}
        <div className="settings-section info-section">
          <div className="section-header">
            <h2>應用資訊</h2>
          </div>
          
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">📱</div>
              <div className="info-content">
                <h3>阿美族家族記帳系統</h3>
                <p>版本 1.0.0</p>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">👤</div>
              <div className="info-content">
                <h3>當前用戶</h3>
                <p>{currentUser.name} ({currentUser.role === 'ADMIN' ? '管理員' : '成員'})</p>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">🎨</div>
              <div className="info-content">
                <h3>目前主題</h3>
                <p>{userSettings.theme === 'light' ? '淺色主題' : '深色主題'}</p>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">💰</div>
              <div className="info-content">
                <h3>貨幣顯示</h3>
                <p>{userSettings.currency}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Settings