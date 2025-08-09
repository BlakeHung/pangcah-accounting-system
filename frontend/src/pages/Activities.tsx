import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'
import { useSnackbar } from '../contexts/SnackbarContext'
import './Activities.css'

interface ManagedGroup {
  id: number
  name: string
  description: string
}

interface User {
  id: number
  username: string
  name: string
  role: string
  managed_groups?: ManagedGroup[]
}

interface Activity {
  id: number
  name: string
  description: string
  start_date: string
  end_date: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  enabled: boolean
  is_user_manager: boolean
  created_at: string
  updated_at: string
}

const Activities: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // 檢查當前用戶
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
  }, [])

  // 獲取活動列表
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['activities'],
    queryFn: async (): Promise<Activity[]> => {
      try {
        const response = await axios.get('/api/v1/events/')
        return Array.isArray(response.data.results) ? response.data.results : response.data
      } catch (error) {
        console.error('獲取活動列表失敗:', error)
        return []
      }
    },
    enabled: !!currentUser
  })

  // 更新活動狀態
  const updateActivityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await axios.patch(`/api/v1/events/${id}/`, data)
      return response.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      if (variables.data.status) {
        const statusMap = {
          'ACTIVE': '進行中',
          'COMPLETED': '已完成',
          'CANCELLED': '已取消'
        }
        showSnackbar(`活動狀態已更新為「${statusMap[variables.data.status]}」`, 'success')
      } else if (variables.data.hasOwnProperty('enabled')) {
        showSnackbar(`活動已${variables.data.enabled ? '啟用' : '停用'}`, 'success')
      }
    },
    onError: (error) => {
      console.error('更新活動失敗:', error)
      showSnackbar('更新活動失敗，請稍後再試', 'error')
    }
  })

  // 刪除活動
  const deleteActivityMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/v1/events/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      showSnackbar('活動已成功刪除', 'success')
    },
    onError: (error) => {
      console.error('刪除活動失敗:', error)
      showSnackbar('刪除活動失敗，請稍後再試', 'error')
    }
  })

  // 過濾活動
  const filteredActivities = activities?.filter(activity => {
    if (statusFilter === 'ALL') return true
    return activity.status === statusFilter
  }) || []

  const handleStatusUpdate = (id: number, status: string) => {
    updateActivityMutation.mutate({ id, data: { status } })
  }

  const handleToggleEnabled = (id: number, enabled: boolean) => {
    updateActivityMutation.mutate({ id, data: { enabled } })
  }

  const handleDelete = (activity: Activity) => {
    if (window.confirm(`確定要刪除活動「${activity.name}」嗎？`)) {
      deleteActivityMutation.mutate(activity.id)
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

  const isActivityActive = (activity: Activity) => {
    const now = new Date()
    const startDate = new Date(activity.start_date)
    const endDate = new Date(activity.end_date)
    return now >= startDate && now <= endDate && activity.status === 'ACTIVE' && activity.enabled
  }

  const canManageActivities = (): boolean => {
    if (!currentUser) return false
    
    // ADMIN可以新增活動
    if (currentUser.role === 'ADMIN') return true
    
    // 群組管理者可以新增活動 - 檢查是否管理任何群組
    if (currentUser.managed_groups && currentUser.managed_groups.length > 0) return true
    
    return false
  }

  const canManageActivity = (activity: Activity): boolean => {
    return activity.is_user_manager
  }

  if (isLoading) {
    return (
      <Layout user={currentUser}>
        <div className="loading">載入中...</div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout user={currentUser}>
        <div className="loading">載入活動列表失敗</div>
      </Layout>
    )
  }

  return (
    <Layout user={currentUser}>
      <div className="activities-container">
        <div className="activities-header">
          <h1>🎉 活動管理</h1>
          {canManageActivities() && (
            <button 
              className="create-button"
              onClick={() => navigate('/activities/new')}
            >
              + 新增活動
            </button>
          )}
        </div>

        {/* 篩選器 */}
        <div className="filters">
          <div className="filter-group">
            <label>狀態篩選:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">全部</option>
              <option value="ACTIVE">進行中</option>
              <option value="COMPLETED">已完成</option>
              <option value="CANCELLED">已取消</option>
            </select>
          </div>
        </div>

        {/* 統計摘要 */}
        <div className="summary-cards">
          <div className="summary-card active">
            <div className="summary-icon">🎯</div>
            <div className="summary-content">
              <h3>進行中活動</h3>
              <p className="summary-count">
                {filteredActivities.filter(a => a.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
          <div className="summary-card completed">
            <div className="summary-icon">✅</div>
            <div className="summary-content">
              <h3>已完成活動</h3>
              <p className="summary-count">
                {filteredActivities.filter(a => a.status === 'COMPLETED').length}
              </p>
            </div>
          </div>
          <div className="summary-card total">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <h3>總活動數</h3>
              <p className="summary-count">{filteredActivities.length}</p>
            </div>
          </div>
        </div>

        {/* 活動列表 */}
        <div className="activities-list">
          {filteredActivities.length > 0 ? (
            filteredActivities.map(activity => (
              <div key={activity.id} className={`activity-card ${getStatusColor(activity.status)}`}>
                <div className="activity-header">
                  <div className="activity-title">
                    <h3>{activity.name}</h3>
                    <div className="activity-badges">
                      <span className={`status-badge ${getStatusColor(activity.status)}`}>
                        {getStatusDisplay(activity.status)}
                      </span>
                      {!activity.enabled && (
                        <span className="disabled-badge">已停用</span>
                      )}
                      {isActivityActive(activity) && (
                        <span className="live-badge">🔴 進行中</span>
                      )}
                    </div>
                  </div>
                  <div className="activity-actions">
                    <button 
                      className="view-btn"
                      onClick={() => navigate(`/activities/${activity.id}`)}
                    >
                      查看
                    </button>
                    <button 
                      className="manage-btn"
                      onClick={() => navigate(`/activities/${activity.id}/manage`)}
                    >
                      管理
                    </button>
                    {canManageActivity(activity) && (
                      <button 
                        className="edit-btn"
                        onClick={() => navigate(`/activities/${activity.id}/edit`)}
                      >
                        編輯
                      </button>
                    )}
                    {canManageActivities() && (
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(activity)}
                      >
                        刪除
                      </button>
                    )}
                  </div>
                </div>

                <div className="activity-content">
                  {activity.description && (
                    <p className="activity-description">{activity.description}</p>
                  )}
                  
                  <div className="activity-dates">
                    <div className="date-item">
                      <span className="date-label">🗓️ 開始:</span>
                      <span className="date-value">
                        {new Date(activity.start_date).toLocaleString()}
                      </span>
                    </div>
                    <div className="date-item">
                      <span className="date-label">🏁 結束:</span>
                      <span className="date-value">
                        {new Date(activity.end_date).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {canManageActivity(activity) && (
                    <div className="activity-controls">
                      <div className="control-group">
                        <label>狀態控制:</label>
                        <div className="status-buttons">
                          {activity.status !== 'ACTIVE' && (
                            <button
                              className="status-btn active"
                              onClick={() => handleStatusUpdate(activity.id, 'ACTIVE')}
                              disabled={updateActivityMutation.isPending}
                            >
                              啟動
                            </button>
                          )}
                          {activity.status !== 'COMPLETED' && (
                            <button
                              className="status-btn completed"
                              onClick={() => handleStatusUpdate(activity.id, 'COMPLETED')}
                              disabled={updateActivityMutation.isPending}
                            >
                              完成
                            </button>
                          )}
                          {activity.status !== 'CANCELLED' && (
                            <button
                              className="status-btn cancelled"
                              onClick={() => handleStatusUpdate(activity.id, 'CANCELLED')}
                              disabled={updateActivityMutation.isPending}
                            >
                              取消
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="control-group">
                        <label>啟用狀態:</label>
                        <button
                          className={`toggle-btn ${activity.enabled ? 'enabled' : 'disabled'}`}
                          onClick={() => handleToggleEnabled(activity.id, !activity.enabled)}
                          disabled={updateActivityMutation.isPending}
                        >
                          {activity.enabled ? '已啟用' : '已停用'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-activities">
              <div className="empty-state">
                <div className="empty-icon">🎪</div>
                <h3>沒有找到活動</h3>
                <p>還沒有任何活動，點擊上方按鈕創建第一個活動吧！</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Activities