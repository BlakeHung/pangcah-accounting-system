import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import Layout from '../components/Layout'
import { useSnackbar } from '../contexts/SnackbarContext'
import './ActivityNew.css'

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

interface Group {
  id: number
  name: string
  description: string
  members: { user: User }[]
}

interface ActivityForm {
  name: string
  description: string
  start_date: string
  end_date: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  enabled: boolean
  group: number | null
  participants: number[]
}

const ActivityNew: React.FC = () => {
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<ActivityForm>({
    name: '',
    description: '',
    start_date: new Date().toISOString().slice(0, 16), // yyyy-MM-ddTHH:mm格式
    end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 預設明天
    status: 'ACTIVE',
    enabled: true,
    group: null,
    participants: []
  })
  const [crossGroupParticipants, setCrossGroupParticipants] = useState<number[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)

  // 檢查當前用戶
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      navigate('/login')
      return
    }
    
    const user = JSON.parse(userData)
    
    // 檢查是否有權限創建活動
    const canCreateActivity = user.role === 'ADMIN' || (user.managed_groups && user.managed_groups.length > 0)
    if (!canCreateActivity) {
      navigate('/activities')
      return
    }
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setCurrentUser(user)
  }, [navigate])

  // 獲取群組列表
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async (): Promise<Group[]> => {
      const response = await axios.get('/api/v1/groups/')
      return response.data.results || response.data
    },
    enabled: !!currentUser
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

  // 創建活動
  const createActivityMutation = useMutation({
    mutationFn: async (data: ActivityForm) => {
      // 將 participants 重新命名為 participant_ids 以符合後端 API
      // 合併群組內參與者和跨群組參與者
      const allParticipantIds = [...data.participants, ...crossGroupParticipants]
      const requestData = {
        ...data,
        participant_ids: allParticipantIds,
        participants: undefined // 移除原始的 participants 欄位
      }
      delete requestData.participants
      
      const response = await axios.post('/api/v1/events/', requestData)
      return response.data
    },
    onSuccess: (data) => {
      showSnackbar('活動創建成功', 'success')
      navigate(`/activities/${data.id}`)
    },
    onError: (error: any) => {
      console.error('創建活動失敗:', error)
      showSnackbar('創建活動失敗，請檢查輸入內容', 'error')
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleGroupSelect = (groupId: string) => {
    const group = groups?.find(g => g.id === parseInt(groupId)) || null
    setSelectedGroup(group)
    setFormData(prev => ({
      ...prev,
      group: group ? group.id : null,
      participants: [] // 重置參與者選擇
    }))
    setCrossGroupParticipants([]) // 重置跨群組參與者選擇
  }

  const handleParticipantToggle = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.includes(userId)
        ? prev.participants.filter(id => id !== userId)
        : [...prev.participants, userId]
    }))
  }

  const handleSelectAllParticipants = () => {
    if (!selectedGroup) return
    
    const allUserIds = selectedGroup.members.map(member => member.user.id)
    const isAllSelected = allUserIds.every(id => formData.participants.includes(id))
    
    setFormData(prev => ({
      ...prev,
      participants: isAllSelected ? [] : allUserIds
    }))
  }

  const handleCrossGroupParticipantToggle = (userId: number) => {
    setCrossGroupParticipants(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 驗證必填欄位
    if (!formData.name || !formData.start_date || !formData.end_date) {
      showSnackbar('請填寫所有必填欄位', 'error')
      return
    }

    // 驗證時間邏輯
    const startDate = new Date(formData.start_date)
    const endDate = new Date(formData.end_date)
    
    if (startDate >= endDate) {
      showSnackbar('結束時間必須晚於開始時間', 'error')
      return
    }

    createActivityMutation.mutate(formData)
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
            onClick={() => navigate('/activities')}
          >
            ← 返回
          </button>
          <h1>🎉 新增活動</h1>
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
            <h2>群組與參與者</h2>
            
            <div className="form-group">
              <label htmlFor="group">選擇主要群組（可選）</label>
              <select
                id="group"
                value={formData.group || ''}
                onChange={(e) => handleGroupSelect(e.target.value)}
              >
                <option value="">不綁定群組（純跨群組活動）</option>
                {groups?.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.members.length} 位成員)
                  </option>
                ))}
              </select>
              <small className="form-hint">
                選擇主要群組可以方便管理，但活動也可以不綁定群組，純粹邀請個別用戶參與
              </small>
            </div>

            {selectedGroup && (
              <div className="form-group">
                <label>選擇參與者</label>
                <div className="participants-selection">
                  <div className="selection-header">
                    <button
                      type="button"
                      className="select-all-btn"
                      onClick={handleSelectAllParticipants}
                    >
                      {selectedGroup.members.every(member => formData.participants.includes(member.user.id))
                        ? '取消全選'
                        : '全選成員'
                      }
                    </button>
                    <span className="selection-count">
                      已選擇 {formData.participants.length} / {selectedGroup.members.length} 位成員
                    </span>
                  </div>
                  
                  <div className="participants-grid">
                    {selectedGroup.members.map(member => (
                      <label key={member.user.id} className="participant-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.participants.includes(member.user.id)}
                          onChange={() => handleParticipantToggle(member.user.id)}
                        />
                        <div className="participant-info">
                          <span className="participant-name">
                            {member.user.name || member.user.username}
                          </span>
                          <span className="participant-username">
                            @{member.user.username}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <small className="form-hint">
                  您可以選擇讓哪些群組成員參與此活動。未選擇的成員可以之後手動加入。
                </small>
              </div>
            )}

            {/* 跨群組參與者選擇 */}
            <div className="form-group">
              <label>邀請其他用戶</label>
              <div className="participants-selection">
                <div className="selection-header">
                  <span className="selection-count">
                    已選擇 {crossGroupParticipants.length} 位用戶
                    {formData.participants.length > 0 && ` (群組內: ${formData.participants.length} 位)`}
                  </span>
                </div>
                
                <div className="participants-grid">
                  {allUsers
                    ?.filter(user => 
                      // 排除群組成員（如果有選擇群組的話）
                      !(selectedGroup?.members.some(member => member.user.id === user.id))
                    )
                    .map(user => (
                      <label key={user.id} className="participant-checkbox">
                        <input
                          type="checkbox"
                          checked={crossGroupParticipants.includes(user.id)}
                          onChange={() => handleCrossGroupParticipantToggle(user.id)}
                        />
                        <div className="participant-info">
                          <span className="participant-name">
                            {user.name || user.username}
                          </span>
                          <span className="participant-username">
                            @{user.username}
                          </span>
                          <span className="member-role">
                            {user.role === 'ADMIN' ? '系統管理員' : 
                             (user.managed_groups && user.managed_groups.length > 0) ? '群組管理員' : '一般用戶'}
                          </span>
                        </div>
                      </label>
                    ))}
                </div>
              </div>
              <small className="form-hint">
                您可以邀請系統中的任何用戶參與活動，不限於特定群組成員
              </small>
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
              <label htmlFor="status">初始狀態</label>
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
                通常新活動設定為「進行中」狀態
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

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/activities')}
            >
              取消
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={createActivityMutation.isPending}
            >
              {createActivityMutation.isPending ? '創建中...' : '創建活動'}
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

export default ActivityNew