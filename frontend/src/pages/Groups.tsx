import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'
import './Groups.css'

interface User {
  id: number
  username: string
  name: string
  role: string
}

interface GroupMember {
  id: number
  name: string
  user?: User
  is_system_user: boolean
}

interface Group {
  id: number
  name: string
  description: string
  created_by: User
  managers: User[]
  members: GroupMember[]
  member_count: number
  created_at: string
}

interface GroupForm {
  name: string
  description: string
  managers: number[]
}

const Groups: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [groupForm, setGroupForm] = useState<GroupForm>({
    name: '',
    description: '',
    managers: []
  })
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)

  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // 檢查當前用戶並設置 axios headers
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    
    if (userData) {
      const user = JSON.parse(userData)
      setCurrentUser(user)
    }
  }, [])

  // 獲取群組列表
  const { data: groups, isLoading: groupsLoading, error: groupsError } = useQuery({
    queryKey: ['groups'],
    queryFn: async (): Promise<Group[]> => {
      try {
        const response = await axios.get('/api/v1/groups/')
        console.log('Groups API response:', response.data)
        
        // 確保返回數組
        if (Array.isArray(response.data)) {
          return response.data
        } else if (response.data && Array.isArray(response.data.results)) {
          // 處理分頁響應
          return response.data.results
        } else {
          console.error('API 返回數據不是數組:', response.data)
          return []
        }
      } catch (error) {
        console.error('獲取群組列表失敗:', error)
        throw error
      }
    }
  })

  // 獲取所有用戶（用於指定管理者）
  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      try {
        const response = await axios.get('/api/v1/auth/users/')
        console.log('Users API response in Groups:', response.data)
        
        // 確保返回數組
        if (Array.isArray(response.data)) {
          return response.data
        } else if (response.data && Array.isArray(response.data.results)) {
          // 處理分頁響應
          return response.data.results
        } else {
          console.error('用戶 API 返回數據不是數組:', response.data)
          return []
        }
      } catch (error) {
        console.error('獲取用戶列表失敗:', error)
        return []  // 返回空數組而不是拋出錯誤，避免影響群組功能
      }
    }
  })

  // 創建群組
  const createGroupMutation = useMutation({
    mutationFn: async (data: GroupForm) => {
      const response = await axios.post('/api/v1/groups/', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setShowCreateForm(false)
      resetForm()
    }
  })

  // 更新群組
  const updateGroupMutation = useMutation({
    mutationFn: async (data: { id: number; groupData: GroupForm }) => {
      const response = await axios.put(`/api/v1/groups/${data.id}/`, data.groupData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setEditingGroup(null)
      resetForm()
    }
  })

  // 刪除群組
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      await axios.delete(`/api/v1/groups/${groupId}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setSelectedGroup(null)
    }
  })

  const resetForm = () => {
    setGroupForm({
      name: '',
      description: '',
      managers: []
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, groupData: groupForm })
    } else {
      createGroupMutation.mutate(groupForm)
    }
  }

  const handleEdit = (group: Group) => {
    setEditingGroup(group)
    setGroupForm({
      name: group.name,
      description: group.description,
      managers: group.managers.map(m => m.id)
    })
    setShowCreateForm(true)
  }

  const handleDelete = (group: Group) => {
    if (window.confirm(`確定要刪除群組「${group.name}」嗎？`)) {
      deleteGroupMutation.mutate(group.id)
    }
  }

  const canManageGroup = (group: Group): boolean => {
    if (!currentUser) return false
    if (currentUser.role === 'ADMIN') return true
    return group.managers.some(m => m.username === currentUser.username)
  }

  const canCreateGroups = (): boolean => {
    return currentUser?.role === 'ADMIN'
  }

  if (groupsLoading) {
    return (
      <Layout user={currentUser}>
        <div className="loading">載入中...</div>
      </Layout>
    )
  }

  if (groupsError) {
    return (
      <Layout user={currentUser}>
        <div className="loading">
          載入群組列表失敗: {groupsError instanceof Error ? groupsError.message : '未知錯誤'}
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={currentUser}>

      <div className="groups-header">
        <h1>👨‍👩‍👧‍👦 群組管理</h1>
        {canCreateGroups() && (
          <button 
            className="create-button"
            onClick={() => setShowCreateForm(true)}
          >
            + 創建群組
          </button>
        )}
      </div>

      <div className="groups-content">
        <div className="groups-list">
          <h2>家族群組 ({groups?.length || 0})</h2>
          <div className="groups-grid">
            {groups?.map(group => (
              <div key={group.id} className="group-card">
                <div className="group-header">
                  <h3>{group.name}</h3>
                  <div className="group-actions">
                    {canManageGroup(group) && (
                      <>
                        <button 
                          className="edit-btn"
                          onClick={() => handleEdit(group)}
                        >
                          ✏️
                        </button>
                        {currentUser?.role === 'ADMIN' && (
                          <button 
                            className="delete-btn"
                            onClick={() => handleDelete(group)}
                          >
                            🗑️
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <p className="group-description">{group.description}</p>
                
                <div className="group-info">
                  <div className="info-item">
                    <span className="label">👑 管理者:</span>
                    <span className="value">
                      {group.managers?.map(m => m.name).join(', ') || '無'}
                    </span>
                  </div>
                  
                  <div className="info-item">
                    <span className="label">👥 成員數:</span>
                    <span className="value">{group.member_count} 人</span>
                  </div>
                  
                  <div className="info-item">
                    <span className="label">📅 創建時間:</span>
                    <span className="value">
                      {new Date(group.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="label">🎉 相關活動:</span>
                    <span className="value">{group.events?.length || 0} 個</span>
                  </div>
                  
                  <div className="info-item">
                    <span className="label">💰 支出記錄:</span>
                    <span className="value">{group.expenses?.length || 0} 筆</span>
                  </div>
                </div>

                <button 
                  className="view-details-btn"
                  onClick={() => setSelectedGroup(group)}
                >
                  查看詳情
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 群組詳情側邊欄 */}
        {selectedGroup && (
          <div className="group-details-sidebar">
            <div className="sidebar-header">
              <h3>{selectedGroup.name}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedGroup(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="sidebar-content">
              <div className="detail-section">
                <h4>📝 描述</h4>
                <p>{selectedGroup.description}</p>
              </div>

              <div className="detail-section">
                <h4>👑 管理者 ({(selectedGroup.managers && Array.isArray(selectedGroup.managers)) ? selectedGroup.managers.length : 0})</h4>
                <ul className="user-list">
                  {(selectedGroup.managers && Array.isArray(selectedGroup.managers)) 
                    ? selectedGroup.managers.map(manager => (
                      <li key={manager.id} className="user-item manager">
                        <span>{manager.name}</span>
                        <span className="username">@{manager.username}</span>
                      </li>
                    ))
                    : <li className="no-data">沒有管理者</li>
                  }
                </ul>
              </div>

              <div className="detail-section">
                <h4>👥 成員 ({(selectedGroup.members && Array.isArray(selectedGroup.members)) ? selectedGroup.members.length : 0})</h4>
                <ul className="user-list">
                  {(selectedGroup.members && Array.isArray(selectedGroup.members)) 
                    ? selectedGroup.members.map(member => (
                      <li key={member.id} className="user-item">
                        <span>{member.name}</span>
                        {member.user && (
                          <span className="username">@{member.user.username}</span>
                        )}
                        {!member.is_system_user && (
                          <span className="guest-badge">訪客</span>
                        )}
                      </li>
                    ))
                    : <li className="no-data">沒有成員</li>
                  }
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 創建/編輯群組表單 */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingGroup ? '編輯群組' : '創建群組'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingGroup(null)
                  resetForm()
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="group-form">
              <div className="form-group">
                <label>群組名稱</label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  required
                  placeholder="輸入群組名稱"
                />
              </div>

              <div className="form-group">
                <label>群組描述</label>
                <textarea
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  placeholder="輸入群組描述"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>群組管理者</label>
                <div className="managers-selection">
                  {(allUsers && Array.isArray(allUsers)) ? allUsers.filter(user => user.role === 'USER').map(user => (
                    <label key={user.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={groupForm.managers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGroupForm({
                              ...groupForm,
                              managers: [...groupForm.managers, user.id]
                            })
                          } else {
                            setGroupForm({
                              ...groupForm,
                              managers: groupForm.managers.filter(id => id !== user.id)
                            })
                          }
                        }}
                      />
                      <span>{user.name} (@{user.username})</span>
                    </label>
                  )) : (
                    <p>載入用戶列表中...</p>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {editingGroup ? '更新群組' : '創建群組'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingGroup(null)
                    resetForm()
                  }}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Groups