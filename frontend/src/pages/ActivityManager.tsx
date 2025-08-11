import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { useSnackbar } from '../contexts/SnackbarContext'

interface User {
  id: number
  username: string
  name: string
  email: string
  role: string
}

interface ActivityParticipant {
  id: number
  user: User
  joined_at: string
  split_option: 'NO_SPLIT' | 'PARTIAL_SPLIT' | 'FULL_SPLIT'
  is_active: boolean
  can_adjust_splits: boolean
}

interface ActivityLog {
  id: number
  action_type: string
  description: string
  operator: User | null
  timestamp: string
  metadata: any
}

interface Activity {
  id: number
  name: string
  description: string
  start_date: string
  end_date: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  group: number
  group_name: string
  managers: User[]
  is_locked: boolean
  settlement_date: string | null
  budget: number | null
  participants: ActivityParticipant[]
  participant_count: number
  total_expenses: number
  is_user_manager: boolean
  is_user_participant: boolean
  created_at: string
}

interface Expense {
  id: number
  amount: number
  type: 'EXPENSE' | 'INCOME'
  date: string
  description: string
  category_name: string
  user: User
  splits: ExpenseSplit[]
  can_user_edit: boolean
  split_total: number
}

interface ExpenseSplit {
  id: number
  participant: User
  split_type: string
  split_value: number
  calculated_amount: number
  is_adjusted: boolean
  can_user_adjust: boolean
}

const ActivityManager: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'participants' | 'logs'>('overview')
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinOption, setJoinOption] = useState<'NO_SPLIT' | 'PARTIAL_SPLIT' | 'FULL_SPLIT'>('FULL_SPLIT')

  // 檢查登入狀態
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
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } catch (error) {
      console.error('用戶資料解析失敗:', error)
      navigate('/login')
    }
  }, [navigate])

  // 獲取活動詳情
  const { data: activity, isLoading: activityLoading } = useQuery<Activity>({
    queryKey: ['activity', id],
    queryFn: async () => {
      const response = await axios.get(`/api/v1/events/${id}/`)
      return response.data
    },
    enabled: !!user && !!id,
  })

  // 獲取活動支出
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['activity-expenses', id],
    queryFn: async () => {
      const response = await axios.get('/api/v1/expenses/', {
        params: { event: id }
      })
      return response.data.results || []
    },
    enabled: !!user && !!id,
  })

  // 獲取活動記錄
  const { data: logs = [] } = useQuery<ActivityLog[]>({
    queryKey: ['activity-logs', id],
    queryFn: async () => {
      const response = await axios.get(`/api/v1/events/${id}/logs/`)
      return response.data
    },
    enabled: !!user && !!id,
  })

  // 加入活動
  const joinActivityMutation = useMutation({
    mutationFn: async (data: { split_option: string; partial_split_expenses?: number[] }) => {
      const response = await axios.post(`/api/v1/events/${id}/join/`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', id] })
      setShowJoinModal(false)
      showSnackbar('成功加入活動', 'success')
    },
    onError: (error) => {
      console.error('加入活動失敗:', error)
      showSnackbar('加入活動失敗，請稍後再試', 'error')
    }
  })

  // 離開活動
  const leaveActivityMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`/api/v1/events/${id}/leave/`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', id] })
      showSnackbar('已離開活動', 'success')
    },
    onError: (error) => {
      console.error('離開活動失敗:', error)
      showSnackbar('離開活動失敗，請稍後再試', 'error')
    }
  })

  // 執行結算
  const settlementMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`/api/v1/events/${id}/settlement/`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', id] })
      showSnackbar('活動結算已完成', 'success')
    },
    onError: (error) => {
      console.error('結算失敗:', error)
      showSnackbar('活動結算失敗，請稍後再試', 'error')
    }
  })

  // 添加管理者
  const addManagerMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await axios.post(`/api/v1/events/${id}/add_manager/`, { user_id: userId })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activity', id] })
      showSnackbar(data.message, 'success')
    },
    onError: (error: any) => {
      console.error('添加管理者失敗:', error)
      const errorMessage = error.response?.data?.error || '添加管理者失敗，請稍後再試'
      showSnackbar(errorMessage, 'error')
    }
  })

  // 移除管理者
  const removeManagerMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await axios.post(`/api/v1/events/${id}/remove_manager/`, { user_id: userId })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activity', id] })
      showSnackbar(data.message, 'success')
    },
    onError: (error: any) => {
      console.error('移除管理者失敗:', error)
      const errorMessage = error.response?.data?.error || '移除管理者失敗，請稍後再試'
      showSnackbar(errorMessage, 'error')
    }
  })

  if (!user) {
    return <div className="loading-container"><div className="loading-spinner">載入中...</div></div>
  }

  if (activityLoading) {
    return (
      <Layout user={user}>
        <div className="loading-container">
          <div className="loading-spinner">載入活動資料中...</div>
        </div>
      </Layout>
    )
  }

  if (!activity) {
    return (
      <Layout user={user}>
        <div className="error-container">
          <h2>找不到活動</h2>
          <button onClick={() => navigate('/activities')} className="btn-primary">
            返回活動列表
          </button>
        </div>
      </Layout>
    )
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '進行中'
      case 'COMPLETED': return '已完成'
      case 'CANCELLED': return '已取消'
      default: return status
    }
  }

  const getSplitOptionDisplay = (option: string) => {
    switch (option) {
      case 'NO_SPLIT': return '不分攤先前費用'
      case 'PARTIAL_SPLIT': return '部分分攤費用'
      case 'FULL_SPLIT': return '分攤所有費用'
      default: return option
    }
  }

  const isBeforeStart = new Date(activity.start_date) > new Date()
  const isInProgress = new Date(activity.start_date) <= new Date() && activity.status === 'ACTIVE'
  const canJoin = !activity.is_user_participant && (isBeforeStart || activity.is_user_manager)
  const canManage = activity.is_user_manager
  const canLeave = activity.is_user_participant || activity.is_user_manager

  return (
    <Layout user={user}>
      <div className="activity-manager">
        {/* 活動標題和狀態 */}
        <div className="activity-header">
          <div className="activity-title">
            <h1>{activity.name}</h1>
            <div className="activity-badges">
              <span className={`badge status-${activity.status.toLowerCase()}`}>
                {getStatusDisplay(activity.status)}
              </span>
              {activity.is_locked && <span className="badge locked">已結算鎖定</span>}
              {canManage && <span className="badge manager">管理者</span>}
            </div>
          </div>
          
          <div className="activity-actions">
            {canJoin && (
              <button 
                className="btn-primary"
                onClick={() => setShowJoinModal(true)}
              >
                加入活動
              </button>
            )}
            
            {canLeave && !activity.is_locked && (
              <button 
                className="btn-outline"
                onClick={() => leaveActivityMutation.mutate()}
                disabled={leaveActivityMutation.isPending}
              >
                {activity.is_user_manager && !activity.is_user_participant ? '移除管理權限' : '離開活動'}
              </button>
            )}
            
            {canManage && activity.status === 'ACTIVE' && (
              <button 
                className="btn-success"
                onClick={() => settlementMutation.mutate()}
                disabled={settlementMutation.isPending}
              >
                執行結算
              </button>
            )}
            
            {canManage && (
              <button 
                className="btn-outline"
                onClick={() => navigate(`/activities/${id}/edit`)}
              >
                編輯活動
              </button>
            )}
          </div>
        </div>

        {/* 活動基本資訊 */}
        <div className="activity-info">
          <div className="info-grid">
            <div className="info-item">
              <label>群組</label>
              <span>{activity.group_name}</span>
            </div>
            <div className="info-item">
              <label>開始時間</label>
              <span>{new Date(activity.start_date).toLocaleString()}</span>
            </div>
            <div className="info-item">
              <label>結束時間</label>
              <span>{new Date(activity.end_date).toLocaleString()}</span>
            </div>
            <div className="info-item">
              <label>參與人數</label>
              <span>{activity.participant_count} 人</span>
            </div>
            <div className="info-item">
              <label>總支出</label>
              <span>NT$ {activity.total_expenses?.toLocaleString() || 0}</span>
            </div>
            {activity.budget && (
              <div className="info-item">
                <label>預算</label>
                <span>NT$ {activity.budget.toLocaleString()}</span>
              </div>
            )}
          </div>
          
          {activity.description && (
            <div className="activity-description">
              <label>活動描述</label>
              <p>{activity.description}</p>
            </div>
          )}
        </div>

        {/* 分頁導航 */}
        <div className="tab-navigation">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            總覽
          </button>
          <button 
            className={activeTab === 'expenses' ? 'active' : ''}
            onClick={() => setActiveTab('expenses')}
          >
            支出記錄 ({expenses.length})
          </button>
          <button 
            className={activeTab === 'participants' ? 'active' : ''}
            onClick={() => setActiveTab('participants')}
          >
            參與者 ({activity.participant_count})
          </button>
          <button 
            className={activeTab === 'logs' ? 'active' : ''}
            onClick={() => setActiveTab('logs')}
          >
            活動記錄 ({logs.length})
          </button>
        </div>

        {/* 分頁內容 */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="overview-grid">
                <div className="overview-card">
                  <h3>管理者</h3>
                  <div className="managers-list">
                    {activity.managers.map(manager => (
                      <div key={manager.id} className="manager-item">
                        <span className="manager-name">{manager.name || manager.username}</span>
                        <span className="manager-role">
                          {manager.role === 'ADMIN' ? '系統管理員' : '活動管理者'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="overview-card">
                  <h3>支出統計</h3>
                  <div className="expense-stats">
                    <div className="stat-item">
                      <span className="stat-value">NT$ {activity.total_expenses?.toLocaleString() || 0}</span>
                      <span className="stat-label">總支出</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{expenses.length}</span>
                      <span className="stat-label">支出筆數</span>
                    </div>
                    {activity.budget && (
                      <div className="stat-item">
                        <span className="stat-value">
                          {((activity.total_expenses || 0) / activity.budget * 100).toFixed(1)}%
                        </span>
                        <span className="stat-label">預算執行率</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="expenses-tab">
              <div className="expenses-header">
                <h3>支出記錄</h3>
                {((activity.status === 'ACTIVE' && activity.is_user_participant) || 
                  activity.is_user_manager || 
                  user?.role === 'ADMIN') && 
                  !activity.is_locked && (
                  <button 
                    className="btn-primary"
                    onClick={() => navigate('/transactions/new', { 
                      state: { defaultActivity: activity.id } 
                    })}
                  >
                    新增支出
                  </button>
                )}
              </div>
              
              <div className="expenses-list">
                {expenses.map(expense => (
                  <div key={expense.id} className="expense-item">
                    <div className="expense-info">
                      <div className="expense-main">
                        <span className="expense-desc">{expense.description}</span>
                        <span className="expense-amount">NT$ {expense.amount.toLocaleString()}</span>
                      </div>
                      <div className="expense-meta">
                        <span className="expense-category">{expense.category_name}</span>
                        <span className="expense-date">
                          {new Date(expense.date).toLocaleDateString()}
                        </span>
                        <span className="expense-user">by {expense.user.name || expense.user.username}</span>
                      </div>
                      <div className="expense-splits">
                        分攤：{expense.splits.length} 人，總計 NT$ {expense.split_total.toLocaleString()}
                      </div>
                    </div>
                    <div className="expense-actions">
                      {expense.can_user_edit && (
                        <button 
                          className="btn-sm btn-outline"
                          onClick={() => navigate(`/transactions/${expense.id}`)}
                        >
                          查看/編輯
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {expenses.length === 0 && (
                  <div className="empty-state">
                    <p>目前還沒有支出記錄</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="participants-tab">
              <div className="participants-list">
                {activity.participants.map(participant => (
                  <div key={participant.id} className="participant-item">
                    <div className="participant-info">
                      <span className="participant-name">
                        {participant.user.name || participant.user.username}
                        {activity.managers.some(m => m.id === participant.user.id) && (
                          <span className="badge manager">管理者</span>
                        )}
                      </span>
                      <span className="participant-email">{participant.user.email}</span>
                    </div>
                    <div className="participant-details">
                      <span className="split-option">
                        {getSplitOptionDisplay(participant.split_option)}
                      </span>
                      <span className="join-date">
                        {new Date(participant.joined_at).toLocaleDateString()}
                      </span>
                      {participant.can_adjust_splits && (
                        <span className="badge can-adjust">可調整分攤</span>
                      )}
                    </div>
                    {canManage && participant.user.id !== user?.id && (
                      <div className="participant-actions">
                        {activity.managers.some(m => m.id === participant.user.id) ? (
                          <button
                            className="btn-secondary small"
                            onClick={() => removeManagerMutation.mutate(participant.user.id)}
                            disabled={removeManagerMutation.isPending}
                          >
                            移除管理者
                          </button>
                        ) : (
                          <button
                            className="btn-primary small"
                            onClick={() => addManagerMutation.mutate(participant.user.id)}
                            disabled={addManagerMutation.isPending}
                          >
                            設為管理者
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="logs-tab">
              <div className="logs-list">
                {logs.map(log => (
                  <div key={log.id} className="log-item">
                    <div className="log-time">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                    <div className="log-content">
                      <span className="log-action">{log.description}</span>
                      {log.operator && (
                        <span className="log-operator">
                          - {log.operator.name || log.operator.username}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                {logs.length === 0 && (
                  <div className="empty-state">
                    <p>目前還沒有操作記錄</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 加入活動模態框 */}
        {showJoinModal && (
          <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>加入活動</h3>
              <p>選擇您的費用分攤方式：</p>
              
              <div className="split-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    value="FULL_SPLIT"
                    checked={joinOption === 'FULL_SPLIT'}
                    onChange={(e) => setJoinOption(e.target.value as any)}
                  />
                  <span>分攤所有費用</span>
                  <small>承擔活動從開始到當前的所有費用</small>
                </label>
                
                <label className="radio-option">
                  <input
                    type="radio"
                    value="NO_SPLIT"
                    checked={joinOption === 'NO_SPLIT'}
                    onChange={(e) => setJoinOption(e.target.value as any)}
                  />
                  <span>不分攤先前費用</span>
                  <small>只承擔加入時點之後的費用</small>
                </label>
                
                <label className="radio-option">
                  <input
                    type="radio"
                    value="PARTIAL_SPLIT"
                    checked={joinOption === 'PARTIAL_SPLIT'}
                    onChange={(e) => setJoinOption(e.target.value as any)}
                  />
                  <span>部分分攤費用</span>
                  <small>選擇特定支出項目進行分攤</small>
                </label>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn-outline"
                  onClick={() => setShowJoinModal(false)}
                >
                  取消
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => joinActivityMutation.mutate({ split_option: joinOption })}
                  disabled={joinActivityMutation.isPending}
                >
                  確認加入
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default ActivityManager