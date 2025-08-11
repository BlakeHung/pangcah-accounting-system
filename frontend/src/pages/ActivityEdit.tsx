import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import Layout from '../components/Layout'
import { useSnackbar } from '../contexts/SnackbarContext'

interface User {
  id: number
  username: string
  name: string
  role: string
}

interface ActivityParticipant {
  id: number
  user: User
  joined_at: string
  split_option: 'NO_SPLIT' | 'PARTIAL_SPLIT' | 'FULL_SPLIT'
  is_active: boolean
}

interface Group {
  id: number
  name: string
  members: { user: User }[]
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
  group: number
  group_name: string
  managers: User[]
  participants: ActivityParticipant[]
  created_at: string
  updated_at: string
}

interface ActivityForm {
  name: string
  description: string
  start_date: string
  end_date: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  enabled: boolean
}

const ActivityEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [groupMembers, setGroupMembers] = useState<Group | null>(null)
  const [formData, setFormData] = useState<ActivityForm>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'ACTIVE',
    enabled: true
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

  // 獲取群組成員
  const { data: groupData } = useQuery({
    queryKey: ['group', activity?.group],
    queryFn: async (): Promise<Group> => {
      const response = await axios.get(`/api/v1/groups/${activity?.group}/`)
      return response.data
    },
    enabled: !!activity?.group
  })

  // 獲取所有用戶（用於跨群組邀請）
  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const response = await axios.get('/api/v1/auth/users/')
      return response.data.results || response.data
    },
    enabled: !!currentUser
  })

  // 在活動資料載入後檢查權限並填充表單
  useEffect(() => {
    if (activity) {
      // 檢查權限
      if (!activity.is_user_manager) {
        navigate('/activities')
        return
      }
      
      // 填充表單
      setFormData({
        name: activity.name,
        description: activity.description,
        start_date: new Date(activity.start_date).toISOString().slice(0, 16),
        end_date: new Date(activity.end_date).toISOString().slice(0, 16),
        status: activity.status,
        enabled: activity.enabled
      })
    }
  }, [activity, navigate])

  // 更新活動
  const updateActivityMutation = useMutation({
    mutationFn: async (data: ActivityForm) => {
      const response = await axios.put(`/api/v1/events/${id}/`, data)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activity', id] })
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      showSnackbar('活動已成功更新', 'success')
      navigate(`/activities/${data.id}`)
    },
    onError: (error: any) => {
      console.error('更新活動失敗:', error)
      showSnackbar('更新活動失敗，請檢查輸入內容', 'error')
    }
  })

  // 邀請用戶加入活動
  const inviteParticipantMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await axios.post(`/api/v1/events/${id}/invite_participant/`, {
        user_id: userId,
        split_option: 'FULL_SPLIT'
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', id] })
      showSnackbar('成功邀請參與者', 'success')
    },
    onError: (error: any) => {
      console.error('邀請參與者失敗:', error)
      const errorMessage = error.response?.data?.error || '邀請參與者失敗，請稍後再試'
      showSnackbar(errorMessage, 'error')
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 驗證必填欄位
    if (!formData.name || !formData.start_date || !formData.end_date) {
      alert('請填寫所有必填欄位')
      return
    }

    // 驗證時間邏輯
    const startDate = new Date(formData.start_date)
    const endDate = new Date(formData.end_date)
    
    if (startDate >= endDate) {
      alert('結束時間必須晚於開始時間')
      return
    }

    updateActivityMutation.mutate(formData)
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
          <p>您要編輯的活動不存在或已被刪除。</p>
          <button onClick={() => navigate('/activities')} className="back-btn">
            返回活動列表
          </button>
        </div>
      </Layout>
    )
  }

  if (!currentUser) {
    return (
      <Layout user={currentUser}>
        <div className="loading">載入中...</div>
      </Layout>
    )
  }

  return (
    <Layout user={currentUser}>
      <div className="activity-new-container">
        <div className="page-header">
          <button 
            className="back-button"
            onClick={() => navigate(`/activities/${id}`)}
          >
            ← 返回
          </button>
          <h1>✏️ 編輯活動</h1>
        </div>

        <form onSubmit={handleSubmit} className="activity-form">
          <div className="form-section">
            <h2>基本資訊</h2>
            
            <div className="form-group">
              <label htmlFor="name">活動名稱 *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="輸入活動名稱"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">活動描述</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="詳細描述這個活動的內容、目的和注意事項..."
                rows={4}
              />
            </div>
          </div>

          <div className="form-section">
            <h2>時間設定</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start_date">開始時間 *</label>
                <input
                  type="datetime-local"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="end_date">結束時間 *</label>
                <input
                  type="datetime-local"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="time-info">
              <div className="duration-display">
                <span className="duration-label">活動時長:</span>
                <span className="duration-value">
                  {(() => {
                    const start = new Date(formData.start_date)
                    const end = new Date(formData.end_date)
                    const diffMs = end.getTime() - start.getTime()
                    if (diffMs <= 0) return '請檢查時間設定'
                    
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

          <div className="form-section">
            <h2>狀態設定</h2>
            
            <div className="form-group">
              <label htmlFor="status">活動狀態</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="ACTIVE">進行中</option>
                <option value="COMPLETED">已完成</option>
                <option value="CANCELLED">已取消</option>
              </select>
              <small className="form-hint">
                更改活動狀態會影響相關功能的使用
              </small>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="enabled"
                  checked={formData.enabled}
                  onChange={handleInputChange}
                />
                <span className="checkbox-text">啟用活動</span>
              </label>
              <small className="form-hint">
                停用的活動不會在前台顯示，但仍可在管理介面中管理
              </small>
            </div>
          </div>

          {/* 參與者管理 */}
          <div className="form-section">
            <h2>參與者管理</h2>
            
            {/* 當前參與者列表 */}
            <div className="form-group">
              <label>目前參與者 ({activity?.participants?.filter(p => p.is_active).length || 0} 人)</label>
              <div className="participants-list">
                {activity?.participants?.filter(p => p.is_active).map(participant => (
                  <div key={participant.id} className="participant-item">
                    <div className="participant-info">
                      <span className="participant-name">
                        {participant.user.name || participant.user.username}
                        {activity.managers.some(m => m.id === participant.user.id) && (
                          <span className="badge manager">管理者</span>
                        )}
                      </span>
                      <span className="participant-details">
                        加入時間: {new Date(participant.joined_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                {(!activity?.participants || activity.participants.filter(p => p.is_active).length === 0) && (
                  <div className="empty-state">
                    <p>目前沒有參與者</p>
                  </div>
                )}
              </div>
            </div>

            {/* 邀請群組成員 */}
            {groupData && (
              <div className="form-group">
                <label>邀請群組成員</label>
                <div className="invite-members">
                  {groupData.members
                    .filter(member => !activity?.participants?.some(p => p.user.id === member.user.id && p.is_active))
                    .map(member => (
                      <div key={member.user.id} className="invite-item">
                        <div className="member-info">
                          <span className="member-name">
                            {member.user.name || member.user.username}
                          </span>
                          <span className="member-username">
                            @{member.user.username}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="invite-btn"
                          onClick={() => inviteParticipantMutation.mutate(member.user.id)}
                          disabled={inviteParticipantMutation.isPending}
                        >
                          邀請
                        </button>
                      </div>
                    ))}
                  {groupData.members.filter(member => 
                    !activity?.participants?.some(p => p.user.id === member.user.id && p.is_active)
                  ).length === 0 && (
                    <div className="empty-state">
                      <p>群組中的所有成員都已是參與者</p>
                    </div>
                  )}
                </div>
                <small className="form-hint">
                  您可以邀請群組中的其他成員加入此活動
                </small>
              </div>
            )}

            {/* 邀請其他用戶 */}
            {allUsers && (
              <div className="form-group">
                <label>邀請其他用戶</label>
                <div className="invite-members">
                  {allUsers
                    .filter(user => 
                      // 排除已經是參與者的用戶
                      !activity?.participants?.some(p => p.user.id === user.id && p.is_active) &&
                      // 排除群組成員（已在上方顯示）
                      !(groupData?.members.some(member => member.user.id === user.id))
                    )
                    .map(user => (
                      <div key={user.id} className="invite-item">
                        <div className="member-info">
                          <span className="member-name">
                            {user.name || user.username}
                          </span>
                          <span className="member-username">
                            @{user.username}
                          </span>
                          <span className="member-role">
                            {user.role === 'ADMIN' ? '系統管理員' : 
                             user.role === 'GROUP_MANAGER' ? '群組管理員' : '一般用戶'}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="invite-btn"
                          onClick={() => inviteParticipantMutation.mutate(user.id)}
                          disabled={inviteParticipantMutation.isPending}
                        >
                          邀請
                        </button>
                      </div>
                    ))}
                  {allUsers.filter(user => 
                    !activity?.participants?.some(p => p.user.id === user.id && p.is_active) &&
                    !(groupData?.members.some(member => member.user.id === user.id))
                  ).length === 0 && (
                    <div className="empty-state">
                      <p>沒有其他可邀請的用戶</p>
                    </div>
                  )}
                </div>
                <small className="form-hint">
                  您可以邀請系統中的任何用戶加入此活動，不限於群組成員
                </small>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate(`/activities/${id}`)}
            >
              取消
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={updateActivityMutation.isPending}
            >
              {updateActivityMutation.isPending ? '更新中...' : '更新活動'}
            </button>
          </div>
        </form>

        {/* 預覽卡片 */}
        <div className="preview-section">
          <h3>活動預覽</h3>
          <div className="activity-preview">
            <div className="preview-header">
              <h4>{formData.name || '活動名稱'}</h4>
              <div className="preview-badges">
                <span className={`status-badge ${formData.status.toLowerCase()}`}>
                  {formData.status === 'ACTIVE' ? '進行中' : 
                   formData.status === 'COMPLETED' ? '已完成' : '已取消'}
                </span>
                {!formData.enabled && (
                  <span className="disabled-badge">已停用</span>
                )}
              </div>
            </div>
            
            {formData.description && (
              <p className="preview-description">{formData.description}</p>
            )}
            
            <div className="preview-dates">
              <div className="date-item">
                <span className="date-label">🗓️ 開始:</span>
                <span className="date-value">
                  {formData.start_date ? new Date(formData.start_date).toLocaleString() : '未設定'}
                </span>
              </div>
              <div className="date-item">
                <span className="date-label">🏁 結束:</span>
                <span className="date-value">
                  {formData.end_date ? new Date(formData.end_date).toLocaleString() : '未設定'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ActivityEdit