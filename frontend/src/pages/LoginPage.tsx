import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './LoginPage.css'

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
    password: 'admin'
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
      const loginResponse = await axios.post<LoginResponse>('/api/v1/auth/login/', formData)
      
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
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🏠 阿美族家族記帳系統</h1>
          <p>請登入以繼續</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="username">帳號</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="請輸入帳號"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">密碼</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="請輸入密碼"
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>測試帳號：admin / admin (系統管理員)</p>
          <p>或使用：alice / password123 (一般用戶)</p>
          <small>Django + React 架構系統</small>
        </div>
      </div>
    </div>
  )
}

export default LoginPage