import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

interface User {
  username: string
  name: string
  role: string
}

interface LayoutProps {
  user: User | null
  children: React.ReactNode
  dashboardData?: any
}

// PAPA 文化圖標組件
const PAPAIcons = {
  Sun: () => <span className="papa-sun-icon" />,
  Mountain: () => <span className="papa-mountain-icon" />,
  Wave: () => <span className="papa-wave-icon" />,
  House: () => <span className="papa-house-icon" />,
  Betel: () => <span className="papa-betel-icon" />,
  Menu: () => <span>☰</span>,
  User: () => <span>👤</span>,
  Chart: () => <span>📊</span>,
  History: () => <span>📋</span>,
  Settings: () => <span>⚙️</span>,
  Users: () => <span>👥</span>,
  Activity: () => <span>🎉</span>
}

// 導航項目配置
const navigationItems = [
  { path: '/dashboard', label: '儀表板', icon: 'Sun', description: '如晨曦照耀部落' },
  { path: '/groups', label: '群組管理', icon: 'House', description: '達魯岸的力量' },
  { path: '/transactions', label: '支出記錄', icon: 'Mountain', description: '山川智慧理財' },
  { path: '/activities', label: '活動管理', icon: 'Activity', description: '部落祭典規劃' },
  { path: '/categories', label: '分類管理', icon: 'Chart', description: '分門別類如潮汐' },
  { path: '/settings', label: '系統設定', icon: 'Betel', description: '檳榔樹下的設定' }
]

const Layout: React.FC<LayoutProps> = ({ user, children, dashboardData }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  if (!user) {
    return <>{children}</>
  }

  // 行動版渲染 - 根據設計稿重新設計
  if (isMobile) {
    return (
      <div className="papa-mobile-container min-h-screen bg-white relative overflow-hidden">
        {/* 阿美族幾何紋樣背景 */}
        <div className="absolute inset-0 tribal-pattern-bg opacity-10"></div>
        
        {/* 頂部區域 - Logo + 用戶資訊 */}
        <div className="relative z-10 pt-4 pb-2 px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="PAPA - Pangcah Accounting" 
              className="w-8 h-8 rounded-full"
            />
            <div className="text-sm font-bold text-papa-stone">PAPA-Accounting</div>
          </div>
          
          {/* 用戶資訊 */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-papa-stone font-medium">{user.name || user.username}</div>
              <div className="text-xs text-papa-cave opacity-70">
                {user.role === 'ADMIN' ? '系統管理員' : '一般用戶'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 active:bg-red-100 transition-colors"
              title="登出"
            >
              🚪
            </button>
          </div>
        </div>

        {/* 主內容區 */}
        <main className="relative z-10 flex-1 px-6 pb-24">
          {children}
        </main>

        {/* 底部導航欄 - iPhone 風格優化 */}
        <nav className="bottom-nav-fixed">
          <div className="flex justify-around items-center px-2 pt-3">
            <button 
              onClick={() => navigate('/dashboard')} 
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-16 ${
                isActive('/dashboard') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 active:bg-gray-100'
              }`}
            >
              <div className="text-2xl">🏠</div>
              <span className="text-xs font-medium">首頁</span>
            </button>
            
            <button 
              onClick={() => navigate('/transactions')} 
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-16 ${
                isActive('/transactions') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 active:bg-gray-100'
              }`}
            >
              <div className="text-2xl">📊</div>
              <span className="text-xs font-medium">記錄</span>
            </button>
            
            {/* 主要操作按鈕 - FAB風格 */}
            <button 
              onClick={() => navigate('/transactions/new')} 
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 active:scale-95 min-w-16"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg active:shadow-md">
                <span className="text-white text-2xl font-light">+</span>
              </div>
              <span className="text-xs font-medium text-blue-600">新增</span>
            </button>
            
            <button 
              onClick={() => navigate('/groups')} 
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-16 ${
                isActive('/groups') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 active:bg-gray-100'
              }`}
            >
              <div className="text-2xl">👥</div>
              <span className="text-xs font-medium">群組</span>
            </button>
            
            <button 
              onClick={() => navigate('/settings')} 
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-16 ${
                isActive('/settings') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 active:bg-gray-100'
              }`}
            >
              <div className="text-2xl">⚙️</div>
              <span className="text-xs font-medium">設定</span>
            </button>
          </div>
        </nav>
      </div>
    )
  }

  // 桌面版渲染
  return (
    <div className="min-h-screen bg-papa-mist">
      {/* 導航欄 */}
      <nav className="papa-navbar">
        <div className="papa-navbar-content">
          <div className="papa-brand">
            <div className="papa-brand-logo">
              <PAPAIcons.Sun />
            </div>
            <div className="papa-brand-text">
              <div className="papa-brand-main">PAPA-Accounting</div>
              <div className="papa-brand-sub">Pangcah Accounting</div>
            </div>
          </div>
          
          {/* 導航選項 */}
          <div className="papa-nav-links">
            {navigationItems.map((item) => {
              const IconComponent = PAPAIcons[item.icon as keyof typeof PAPAIcons]
              return (
                <button
                  key={item.path}
                  className={`papa-nav-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                  title={item.description}
                >
                  <IconComponent />
                  <span>{item.label}</span>
                </button>
              )
            })}
            
            {/* 管理員專用 */}
            {user.role === 'ADMIN' && (
              <button
                className={`papa-nav-link ${isActive('/users') ? 'active' : ''}`}
                onClick={() => navigate('/users')}
                title="管理部落族人"
              >
                <PAPAIcons.Users />
                <span>用戶管理</span>
              </button>
            )}
          </div>

          {/* 用戶信息 */}
          <div className="papa-user-info">
            <div className="papa-user-avatar">
              {(user.name || user.username).charAt(0)}
            </div>
            <div>
              <div className="font-medium">{user.name || user.username}</div>
              <div className="text-sm opacity-80">
                {user.role === 'ADMIN' ? '系統管理員' : '一般用戶'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="papa-logout-btn"
              title="登出系統"
            >
              🚪
            </button>
          </div>
        </div>
      </nav>

      {/* 主內容區 */}
      <main className="papa-main-content">
        {children}
      </main>
    </div>
  )
}

export default Layout