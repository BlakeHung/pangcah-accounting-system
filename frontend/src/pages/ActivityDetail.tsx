import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import Layout from '../components/Layout'

interface User {
  id: number
  username: string
  name: string
  role: string
}

interface Activity {
  id: number
  name: string
  description: string
  start_date: string
  end_date: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  enabled: boolean
  created_at: string
  updated_at: string
}

interface Expense {
  id: number
  amount: string
  type: 'EXPENSE' | 'INCOME'
  date: string
  description: string
  user: {
    id: number
    name: string
  }
  category: {
    id: number
    name: string
  }
}

const ActivityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // 檢查當前用戶
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      navigate('/login')
      return
    }
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setCurrentUser(JSON.parse(userData))
  }, [navigate])

  // 獲取活動詳情
  const { data: activity, isLoading, error } = useQuery({
    queryKey: ['activity', id],
    queryFn: async (): Promise<Activity> => {
      const response = await axios.get(`/api/v1/events/${id}/`)
      return response.data
    },
    enabled: !!id && !!currentUser
  })

  // 獲取相關支出記錄
  const { data: expenses = [] } = useQuery({
    queryKey: ['activity-expenses', id],
    queryFn: async (): Promise<Expense[]> => {
      try {
        const response = await axios.get(`/api/v1/expenses/?event=${id}`)
        return Array.isArray(response.data.results) ? response.data.results : response.data
      } catch (error) {
        console.error('獲取相關支出記錄失敗:', error)
        return []
      }
    },
    enabled: !!id && !!currentUser
  })

  // 更新活動狀態
  const updateActivityMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.patch(`/api/v1/events/${id}/`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', id] })
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    }
  })

  // 刪除活動
  const deleteActivityMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`/api/v1/events/${id}/`)
    },
    onSuccess: () => {
      navigate('/activities')
    }
  })

  const handleStatusUpdate = (status: string) => {
    updateActivityMutation.mutate({ status })
  }

  const handleToggleEnabled = () => {
    if (!activity) return
    updateActivityMutation.mutate({ enabled: !activity.enabled })
  }

  const handleDelete = () => {
    if (!activity) return
    
    const confirmMessage = `確定要刪除活動「${activity.name}」嗎？這將同時影響所有相關的支出記錄。`
    if (window.confirm(confirmMessage)) {
      deleteActivityMutation.mutate()
    }
  }

  const getStatusDisplay = (status: string) => {
    const statusMap = {
      'ACTIVE': '進行中',
      'COMPLETED': '已完成',
      'CANCELLED': '已取消'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      'ACTIVE': 'active',
      'COMPLETED': 'completed',
      'CANCELLED': 'cancelled'
    }
    return colorMap[status] || 'default'
  }

  const isActivityActive = () => {
    if (!activity) return false
    const now = new Date()
    const startDate = new Date(activity.start_date)
    const endDate = new Date(activity.end_date)
    return now >= startDate && now <= endDate && activity.status === 'ACTIVE' && activity.enabled
  }

  const canManageActivity = (): boolean => {
    return currentUser?.role === 'ADMIN'
  }

  const calculateExpenseStats = () => {
    const totalExpenses = expenses
      .filter(expense => expense.type === 'EXPENSE')
      .reduce((sum, expense) => sum + Math.abs(parseFloat(String(expense.amount))), 0)
    
    const totalIncome = expenses
      .filter(expense => expense.type === 'INCOME')
      .reduce((sum, expense) => sum + Math.abs(parseFloat(String(expense.amount))), 0)

    return { totalExpenses, totalIncome, netAmount: totalIncome - totalExpenses }
  }

  if (isLoading) {
    return (
      <Layout user={currentUser}>
        <div className="loading">載入中...</div>
      </Layout>
    )
  }

  if (error || !activity) {
    return (
      <Layout user={currentUser}>
        <div className="error-container">
          <h2>找不到活動</h2>
          <p>您要查看的活動不存在或已被刪除。</p>
          <button onClick={() => navigate('/activities')} className="back-btn">
            返回活動列表
          </button>
        </div>
      </Layout>
    )
  }

  const { totalExpenses, totalIncome, netAmount } = calculateExpenseStats()

  return (
    <Layout user={currentUser}>
      <div className="activity-detail-container">
        {/* 頁面標題 */}
        <div className="page-header">
          <button 
            className="back-button"
            onClick={() => navigate('/activities')}
          >
            ← 返回
          </button>
          <h1>🎉 {activity.name}</h1>
          {canManageActivity() && (
            <div className="header-actions">
              <button 
                className="edit-btn"
                onClick={() => navigate(`/activities/${id}/edit`)}
              >
                編輯
              </button>
              <button 
                className="delete-btn"
                onClick={handleDelete}
                disabled={deleteActivityMutation.isPending}
              >
                {deleteActivityMutation.isPending ? '刪除中...' : '刪除'}
              </button>
            </div>
          )}
        </div>

        {/* 活動狀態卡片 */}
        <div className={`info-card main-info ${getStatusColor(activity.status)}`}>
          <div className="status-section">
            <div className="status-badges">
              <span className={`status-badge ${getStatusColor(activity.status)}`}>
                {getStatusDisplay(activity.status)}
              </span>
              {!activity.enabled && (
                <span className="disabled-badge">已停用</span>
              )}
              {isActivityActive() && (
                <span className="live-badge">🔴 進行中</span>
              )}
            </div>
          </div>
          
          <div className="activity-dates">
            <div className="date-item">
              <span className="date-label">🗓️ 開始時間:</span>
              <span className="date-value">{new Date(activity.start_date).toLocaleString()}</span>
            </div>
            <div className="date-item">
              <span className="date-label">🏁 結束時間:</span>
              <span className="date-value">{new Date(activity.end_date).toLocaleString()}</span>
            </div>
            <div className="date-item">
              <span className="date-label">⏱️ 活動時長:</span>
              <span className="date-value">
                {(() => {
                  const diffMs = new Date(activity.end_date).getTime() - new Date(activity.start_date).getTime()
                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                  const diffDays = Math.floor(diffHours / 24)
                  
                  if (diffDays > 0) {
                    return `${diffDays} 天 ${diffHours % 24} 小時`
                  } else {
                    return `${diffHours} 小時`
                  }
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* 活動描述 */}
        {activity.description && (
          <div className="info-card">
            <h3>📝 活動描述</h3>
            <p className="description">{activity.description}</p>
          </div>
        )}

        {/* 財務統計 */}
        <div className="info-card">
          <h3>💰 財務統計</h3>
          <div className="finance-stats">
            <div className="stat-item expense">
              <div className="stat-icon">💸</div>
              <div className="stat-content">
                <span className="stat-label">總支出</span>
                <span className="stat-value">NT$ {totalExpenses.toLocaleString()}</span>
              </div>
            </div>
            <div className="stat-item income">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <span className="stat-label">總收入</span>
                <span className="stat-value">NT$ {totalIncome.toLocaleString()}</span>
              </div>
            </div>
            <div className="stat-item balance">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <span className="stat-label">淨額</span>
                <span className={`stat-value ${netAmount >= 0 ? 'positive' : 'negative'}`}>
                  NT$ {netAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 相關支出記錄 */}
        <div className="info-card">
          <div className="section-header">
            <h3>💳 相關支出記錄 ({expenses.length})</h3>
            <button
              className="add-expense-btn"
              onClick={() => navigate('/transactions/new')}
            >
              + 新增記錄
            </button>
          </div>
          
          {expenses.length > 0 ? (
            <div className="expenses-list">
              {expenses.map(expense => (
                <div 
                  key={expense.id} 
                  className={`expense-item ${expense.type.toLowerCase()}`}
                  onClick={() => navigate(`/transactions/${expense.id}`)}
                >
                  <div className="expense-icon">
                    {expense.type === 'EXPENSE' ? '💸' : '💰'}
                  </div>
                  <div className="expense-content">
                    <div className="expense-header">
                      <span className="expense-description">
                        {expense.description || '無描述'}
                      </span>
                      <span className={`expense-amount ${expense.type.toLowerCase()}`}>
                        {expense.type === 'EXPENSE' ? '-' : '+'}NT$ {Math.abs(parseFloat(String(expense.amount))).toLocaleString()}
                      </span>
                    </div>
                    <div className="expense-details">
                      <span className="expense-category">📂 {expense.category.name}</span>
                      <span className="expense-user">👤 {expense.user.name}</span>
                      <span className="expense-date">📅 {new Date(expense.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-expenses">
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <p>此活動還沒有相關的支出記錄</p>
              </div>
            </div>
          )}
        </div>

        {/* 管理操作 */}
        {canManageActivity() && (
          <div className="info-card management-card">
            <h3>⚙️ 管理操作</h3>
            
            <div className="management-section">
              <div className="control-group">
                <span className="control-label">狀態控制:</span>
                <div className="status-buttons">
                  {activity.status !== 'ACTIVE' && (
                    <button
                      className="status-btn active"
                      onClick={() => handleStatusUpdate('ACTIVE')}
                      disabled={updateActivityMutation.isPending}
                    >
                      啟動活動
                    </button>
                  )}
                  {activity.status !== 'COMPLETED' && (
                    <button
                      className="status-btn completed"
                      onClick={() => handleStatusUpdate('COMPLETED')}
                      disabled={updateActivityMutation.isPending}
                    >
                      標記完成
                    </button>
                  )}
                  {activity.status !== 'CANCELLED' && (
                    <button
                      className="status-btn cancelled"
                      onClick={() => handleStatusUpdate('CANCELLED')}
                      disabled={updateActivityMutation.isPending}
                    >
                      取消活動
                    </button>
                  )}
                </div>
              </div>
              
              <div className="control-group">
                <span className="control-label">啟用狀態:</span>
                <button
                  className={`toggle-btn ${activity.enabled ? 'enabled' : 'disabled'}`}
                  onClick={handleToggleEnabled}
                  disabled={updateActivityMutation.isPending}
                >
                  {activity.enabled ? '✅ 已啟用' : '❌ 已停用'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 時間記錄 */}
        <div className="info-card">
          <h3>🕐 時間記錄</h3>
          <div className="time-info">
            <div className="info-row">
              <span className="label">創建時間:</span>
              <span className="value">{new Date(activity.created_at).toLocaleString()}</span>
            </div>
            <div className="info-row">
              <span className="label">最後更新:</span>
              <span className="value">{new Date(activity.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ActivityDetail