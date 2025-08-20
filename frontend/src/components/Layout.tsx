import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { useSnackbar } from '../contexts/SnackbarContext'
import NotificationCenter from './NotificationCenter'
import { loadAlertNotifications } from '../utils/dashboardConfig'

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

// 導航圖標組件
const NavigationIcons = {
  Sun: () => <span>🏠</span>,
  Mountain: () => <span>⛰️</span>,
  Wave: () => <span>🌊</span>,
  House: () => <span>🏠</span>,
  Betel: () => <span>🌿</span>,
  Menu: () => <span>☰</span>,
  User: () => <span>👤</span>,
  Chart: () => <span>📊</span>,
  History: () => <span>📋</span>,
  Settings: () => <span>⚙️</span>,
  Users: () => <span>👥</span>,
  Activity: () => <span>🎉</span>,
  Realtime: () => <span>📡</span>,
  Reports: () => <span>📝</span>,
  Visualization: () => <span>🎨</span>
}
// 導航項目配置
const navigationItems = [
  { path: '/dashboard', label: '儀表板', icon: 'Chart', description: '查看系統總覽與統計' },
  { path: '/groups', label: '群組管理', icon: 'Users', description: '管理群組與成員' },
  { path: '/transactions', label: '支出記錄', icon: 'Mountain', description: '記錄收入與支出' },
  { path: '/activities', label: '活動管理', icon: 'Activity', description: '管理活動與分帳' },
  { path: '/categories', label: '分類管理', icon: 'History', description: '設定支出分類' },
  { path: '/dashboard/realtime', label: '即時監控', icon: 'Realtime', description: '即時系統監控與活動' },
  { path: '/reports', label: '自訂報表', icon: 'Reports', description: '建立客製化分析報表' },
  { path: '/visualization', label: '互動視覺', icon: 'Visualization', description: 'D3.js 互動式圖表' },
  { path: '/settings', label: '系統設定', icon: 'Settings', description: '系統偏好設定' }
]

const Layout: React.FC<LayoutProps> = ({ user, children, dashboardData }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { showSnackbar } = useSnackbar()
  const [isMobile, setIsMobile] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  // 載入未讀通知數量
  useEffect(() => {
    const updateUnreadCount = () => {
      const notifications = loadAlertNotifications()
      const unread = notifications.filter(n => !n.read).length
      setUnreadCount(unread)
    }

    updateUnreadCount()
    
    // 每30秒更新一次通知數量
    const interval = setInterval(updateUnreadCount, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    const currentUser = user?.name || user?.username
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    showSnackbar(`👋 再見，${currentUser}！`, 'info')
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
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => {
                // 備用圖標
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement?.insertAdjacentHTML(
                  'beforeend',
                  '<div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#2E8B57] to-[#5F9EA0] flex items-center justify-center text-white font-bold text-sm">P</div>'
                )
              }}
            />
            <div className="text-sm font-bold text-gray-800">Pangcah Accounting</div>
          </div>
          
          {/* 用戶資訊 */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-800 font-medium">{user.name || user.username}</div>
              <div className="text-xs text-gray-600 opacity-70">
                {user.role === 'ADMIN' ? '系統管理員' : '一般用戶'}
              </div>
            </div>
            
            {/* 行動版通知中心按鈕 */}
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="relative w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 active:bg-blue-100 transition-colors"
              title="通知中心"
            >
              <span className="text-lg">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center" style={{fontSize: '10px'}}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
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
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
          <div className="flex justify-around items-center px-2 pt-3">
            <button 
              onClick={() => navigate('/dashboard')} 
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-16 ${
                isActive('/dashboard') 
                  ? 'text-[#2E8B57] bg-green-50' 
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
                  ? 'text-[#2E8B57] bg-green-50' 
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
              <div className="w-12 h-12 rounded-full bg-[#2E8B57] flex items-center justify-center shadow-lg active:shadow-md">
                <span className="text-white text-2xl font-light">+</span>
              </div>
              <span className="text-xs font-medium text-[#2E8B57]">新增</span>
            </button>
            
            <button 
              onClick={() => navigate('/groups')} 
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-16 ${
                isActive('/groups') 
                  ? 'text-[#2E8B57] bg-green-50' 
                  : 'text-gray-500 active:bg-gray-100'
              }`}
            >
              <div className="text-2xl">👥</div>
              <span className="text-xs font-medium">群組</span>
            </button>
            
            <button 
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-16 ${
                isMoreMenuOpen
                  ? 'text-[#2E8B57] bg-green-50' 
                  : 'text-gray-500 active:bg-gray-100'
              }`}
            >
              <div className="text-2xl">⋯</div>
              <span className="text-xs font-medium">更多</span>
            </button>
          </div>
        </nav>
        
        {/* 更多功能選單 */}
        {isMoreMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMoreMenuOpen(false)}>
            <div className="absolute bottom-20 left-4 right-4 bg-white rounded-xl shadow-xl max-w-sm mx-auto">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">更多功能</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      navigate('/dashboard/realtime')
                      setIsMoreMenuOpen(false)
                    }}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-2xl">📡</span>
                    <span className="text-sm font-medium text-gray-800">即時監控</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/reports')
                      setIsMoreMenuOpen(false)
                    }}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-2xl">📝</span>
                    <span className="text-sm font-medium text-gray-800">自訂報表</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/visualization')
                      setIsMoreMenuOpen(false)
                    }}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-2xl">🎨</span>
                    <span className="text-sm font-medium text-gray-800">互動視覺</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/settings')
                      setIsMoreMenuOpen(false)
                    }}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-2xl">⚙️</span>
                    <span className="text-sm font-medium text-gray-800">系統設定</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 行動版通知中心 */}
        <NotificationCenter
          isOpen={isNotificationOpen}
          onClose={() => {
            setIsNotificationOpen(false)
            // 關閉後重新載入未讀數量
            const notifications = loadAlertNotifications()
            const unread = notifications.filter(n => !n.read).length
            setUnreadCount(unread)
          }}
        />
      </div>
    )
  }

  // 桌面版渲染 - 側邊欄 + 頂部欄佈局
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 側邊欄 */}
      <aside className={`bg-white shadow-lg border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Logo 區域 - 參考行動版設計 */}
        <div className={`p-6 border-b border-gray-200 ${
          isSidebarCollapsed ? 'flex justify-center' : ''
        }`}>
          <div className={`flex items-center gap-2 ${
            isSidebarCollapsed ? 'justify-center' : ''
          }`}>
            <img 
              src="/logo.png"
              alt="PAPA - Pangcah Accounting" 
              className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
              onError={(e) => {
                // 備用圖標
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement?.insertAdjacentHTML(
                  'beforeend',
                  '<div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#2E8B57] to-[#5F9EA0] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">P</div>'
                )
              }}
            />
            {!isSidebarCollapsed && (
              <div className="transition-opacity duration-300">
                <div className="text-sm font-bold text-gray-800">Pangcah Accounting</div>
              </div>
            )}
          </div>
        </div>
        
        {/* 伸縬按鈕 */}
        <div className="px-4 py-2">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={isSidebarCollapsed ? '展開側邊欄' : '收起側邊欄'}
          >
            <svg 
              className="w-5 h-5 transform transition-transform duration-300"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isSidebarCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>
        
        {/* 導航選項 */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const IconComponent = NavigationIcons[item.icon as keyof typeof NavigationIcons]
              return (
                <button
                  key={item.path}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left relative group overflow-hidden ${
                    isActive(item.path) 
                      ? 'text-white bg-[#2E8B57]' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => navigate(item.path)}
                  title={isSidebarCollapsed ? item.label : item.description}
                >
                  <span className="text-lg flex-shrink-0"><IconComponent /></span>
                  {!isSidebarCollapsed && (
                    <span className="font-medium text-sm transition-opacity duration-300">{item.label}</span>
                  )}
                  {/* 收起時的提示 */}
                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              )
            })}
            
            {/* 管理員專用 */}
            {user.role === 'ADMIN' && (
              <button
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left relative group overflow-hidden ${
                  isActive('/users') 
                    ? 'text-white bg-[#2E8B57]' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => navigate('/users')}
                title={isSidebarCollapsed ? '用戶管理' : '管理部落族人'}
              >
                <span className="text-lg flex-shrink-0"><NavigationIcons.Users /></span>
                {!isSidebarCollapsed && (
                  <span className="font-medium text-sm transition-opacity duration-300">用戶管理</span>
                )}
                {/* 收起時的提示 */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                    用戶管理
                  </div>
                )}
              </button>
            )}
          </div>
        </nav>
        
        {/* 用戶信息區域 */}
        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center p-3 rounded-lg bg-gray-50 transition-all duration-300 ${
            isSidebarCollapsed ? 'justify-center' : 'gap-3'
          }`}>
            <div className="w-10 h-10 bg-gradient-to-br from-[#2E8B57] to-[#5F9EA0] rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
              {(user.name || user.username).charAt(0).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <>
                <div className="flex-1 min-w-0 transition-opacity duration-300">
                  <div className="font-medium text-gray-800 text-sm truncate">{user.name || user.username}</div>
                  <div className="text-xs text-gray-500">
                    {user.role === 'ADMIN' ? '系統管理員' : '一般用戶'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="登出系統"
                >
                  <span className="text-sm">🚪</span>
                </button>
              </>
            )}
            {/* 收起時的登出按鈕 */}
            {isSidebarCollapsed && (
              <div className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={handleLogout}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  title="登出系統"
                >
                  <span className="text-sm">🚪</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 主內容區域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 頂部欄 */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* 預留位置給未來的操作按鈕 */}
              <div>
                <h1 className="text-xl font-semibold text-gray-800">
                  {navigationItems.find(item => isActive(item.path))?.label || 
                   (isActive('/users') ? '用戶管理' : '儀表板')}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {navigationItems.find(item => isActive(item.path))?.description || 
                   (isActive('/users') ? '管理部落族人' : '如晨曦照耀部落')}
                </p>
              </div>
            </div>
            
            {/* 快速操作按鈕 */}
            <div className="flex items-center gap-3">
              {/* 通知中心按鈕 - 桌面版一直顯示 */}
              <button
                onClick={() => setIsNotificationOpen(true)}
                className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="通知中心"
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => navigate('/transactions/new')}
                className="bg-[#2E8B57] hover:bg-[#1F5F3F] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg"
              >
                <span>+</span>
                <span>新增記錄</span>
              </button>
            </div>
          </div>
        </header>
        
        {/* 主內容 */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
      
      {/* 通知中心 */}
      <NotificationCenter
        isOpen={isNotificationOpen}
        onClose={() => {
          setIsNotificationOpen(false)
          // 關閉後重新載入未讀數量
          const notifications = loadAlertNotifications()
          const unread = notifications.filter(n => !n.read).length
          setUnreadCount(unread)
        }}
      />
    </div>
  )
}

export default Layout