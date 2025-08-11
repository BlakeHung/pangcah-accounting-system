import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from './Layout'

interface User {
  username: string
  name: string
  role: string
}

interface WrapperProps {
  children: React.ReactNode
}

/**
 * PAPA 通用包裝器組件
 * 為所有頁面提供統一的 PAPA 主題佈局和用戶認證處理
 */
const Wrapper: React.FC<WrapperProps> = ({ children }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      navigate('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      
      // 設置 axios 認證頭
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to parse user data:', error)
      navigate('/login')
    }
  }, [navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-papa-mist flex items-center justify-center">
        <div className="papa-loading">
          <div className="papa-sun-loading"></div>
          <p className="papa-loading-text">如石坑之水，正在湧現...</p>
        </div>
      </div>
    )
  }

  return (
    <Layout user={user}>
      {children}
    </Layout>
  )
}

export default Wrapper