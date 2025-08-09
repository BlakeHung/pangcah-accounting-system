import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import './Layout.css'

interface User {
  username: string
  name: string
  role: string
}

interface LayoutProps {
  user: User | null
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ user, children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    navigate('/login')
  }

  const getNavItemClass = (path: string) => {
    return location.pathname === path ? 'nav-item active' : 'nav-item'
  }

  const handleNavClick = (path: string) => {
    navigate(path)
    setIsMobileMenuOpen(false) // 導航後關閉手機選單
  }

  if (!user) {
    return <>{children}</>
  }

  return (
    <div className="layout">
      {/* 頂部導航欄 */}
      <header className="layout-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🏠 家族記帳系統</h1>
            <span className="welcome-text">歡迎，{user.name || user.username}</span>
          </div>
          <div className="header-right">
            <span className="user-role">
              {user.role === 'ADMIN' ? '系統管理員' : '一般用戶'}
            </span>
            <button onClick={handleLogout} className="logout-button">
              登出
            </button>
          </div>
          {/* 手機版漢堡選單按鈕 */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="選單"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {/* 桌面版導航欄 */}
      <nav className="layout-nav desktop-nav">
        <div className="nav-content">
          <button 
            className={getNavItemClass('/dashboard')}
            onClick={() => navigate('/dashboard')}
          >
            🏠 儀表板
          </button>
          <button 
            className={getNavItemClass('/groups')}
            onClick={() => navigate('/groups')}
          >
            👨‍👩‍👧‍👦 群組管理
          </button>
          {user.role === 'ADMIN' && (
            <button 
              className={getNavItemClass('/users')}
              onClick={() => navigate('/users')}
            >
              👥 用戶管理
            </button>
          )}
          <button 
            className={getNavItemClass('/transactions')}
            onClick={() => navigate('/transactions')}
          >
            💰 支出記錄
          </button>
          <button 
            className={getNavItemClass('/activities')}
            onClick={() => navigate('/activities')}
          >
            🎉 活動管理
          </button>
          <button 
            className={getNavItemClass('/categories')}
            onClick={() => navigate('/categories')}
          >
            📊 分類管理
          </button>
          <button 
            className={getNavItemClass('/settings')}
            onClick={() => navigate('/settings')}
          >
            ⚙️ 系統設定
          </button>
        </div>
      </nav>

      {/* 手機版導航選單 */}
      <div className={`mobile-nav-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
        <nav className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-nav-header">
            <div className="mobile-user-info">
              <div className="mobile-avatar">
                {(user.name || user.username).charAt(0)}
              </div>
              <div>
                <div className="mobile-user-name">{user.name || user.username}</div>
                <div className="mobile-user-role">
                  {user.role === 'ADMIN' ? '系統管理員' : '一般用戶'}
                </div>
              </div>
            </div>
            <button 
              className="mobile-close"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="mobile-nav-content">
            <button 
              className={`mobile-nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
              onClick={() => handleNavClick('/dashboard')}
            >
              <span className="nav-icon">🏠</span>
              <span>儀表板</span>
            </button>
            <button 
              className={`mobile-nav-item ${location.pathname === '/groups' ? 'active' : ''}`}
              onClick={() => handleNavClick('/groups')}
            >
              <span className="nav-icon">👨‍👩‍👧‍👦</span>
              <span>群組管理</span>
            </button>
            {user.role === 'ADMIN' && (
              <button 
                className={`mobile-nav-item ${location.pathname === '/users' ? 'active' : ''}`}
                onClick={() => handleNavClick('/users')}
              >
                <span className="nav-icon">👥</span>
                <span>用戶管理</span>
              </button>
            )}
            <button 
              className={`mobile-nav-item ${location.pathname === '/transactions' ? 'active' : ''}`}
              onClick={() => handleNavClick('/transactions')}
            >
              <span className="nav-icon">💰</span>
              <span>支出記錄</span>
            </button>
            <button 
              className={`mobile-nav-item ${location.pathname === '/activities' ? 'active' : ''}`}
              onClick={() => handleNavClick('/activities')}
            >
              <span className="nav-icon">🎉</span>
              <span>活動管理</span>
            </button>
            <button 
              className={`mobile-nav-item ${location.pathname === '/categories' ? 'active' : ''}`}
              onClick={() => handleNavClick('/categories')}
            >
              <span className="nav-icon">📊</span>
              <span>分類管理</span>
            </button>
            <button 
              className={`mobile-nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
              onClick={() => handleNavClick('/settings')}
            >
              <span className="nav-icon">⚙️</span>
              <span>系統設定</span>
            </button>
          </div>
          
          <div className="mobile-nav-footer">
            <button className="mobile-logout" onClick={handleLogout}>
              <span className="nav-icon">🚪</span>
              <span>登出</span>
            </button>
          </div>
        </nav>
      </div>

      {/* 主要內容 */}
      <main className="layout-main">
        {children}
      </main>
    </div>
  )
}

export default Layout