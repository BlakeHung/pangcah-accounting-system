import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import Layout from '../components/Layout'
import './TransactionNew.css'

interface User {
  id: number
  username: string
  name: string
  role: string
}

interface Category {
  id: number
  name: string
  type: string
}

interface Group {
  id: number
  name: string
  description: string
}

interface Event {
  id: number
  name: string
  description: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  enabled: boolean
  allow_split: boolean
}

interface SplitData {
  user_id: number
  value: number
  calculated_amount: number
}

interface TransactionForm {
  amount: string
  type: 'EXPENSE' | 'INCOME'
  date: string
  description: string
  images: string[]
  category: number | ''
  event: number | ''
  group: number | ''
  split_type: 'NONE' | 'AVERAGE' | 'RATIO' | 'FIXED'
  split_participants: number[]
  split_data: SplitData[]
}

const TransactionNew: React.FC = () => {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<TransactionForm>({
    amount: '',
    type: 'EXPENSE',
    date: new Date().toISOString().slice(0, 16), // yyyy-MM-ddTHH:mm格式
    description: '',
    images: [],
    category: '',
    event: '',
    group: '',
    split_type: 'NONE',
    split_participants: [],
    split_data: []
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

  // 監聽金額變化重新計算分攤
  useEffect(() => {
    if (formData.split_data.length > 0 && formData.amount && formData.split_type !== 'NONE') {
      const newSplitData = calculateSplitAmounts(formData)
      
      // 只有當計算結果真正改變時才更新
      const hasChanged = newSplitData.some((newSplit, index) => {
        const oldSplit = formData.split_data[index]
        return !oldSplit || Math.abs(newSplit.calculated_amount - oldSplit.calculated_amount) > 0.01
      })
      
      if (hasChanged) {
        setFormData(prev => ({
          ...prev,
          split_data: newSplitData
        }))
      }
    }
  }, [formData.amount, formData.split_type, formData.split_participants.length])

  // 獲取分類
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      try {
        const response = await axios.get('/api/v1/categories/')
        return Array.isArray(response.data.results) ? response.data.results : response.data
      } catch (error) {
        console.error('獲取分類失敗:', error)
        return []
      }
    },
    enabled: !!currentUser
  })

  // 獲取群組
  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: async (): Promise<Group[]> => {
      try {
        const response = await axios.get('/api/v1/groups/')
        return Array.isArray(response.data.results) ? response.data.results : response.data
      } catch (error) {
        console.error('獲取群組失敗:', error)
        return []
      }
    },
    enabled: !!currentUser
  })

  // 獲取選定群組的成員
  const { data: groupMembers = [] } = useQuery({
    queryKey: ['group-members', formData.group],
    queryFn: async (): Promise<User[]> => {
      if (!formData.group) return []
      try {
        const response = await axios.get(`/api/v1/groups/${formData.group}/`)
        const group = response.data
        // 合併管理者和普通成員
        const managers = group.managers || []
        const members = (group.members || [])
          .filter((member: any) => member.user && member.is_system_user)
          .map((member: any) => member.user)
        
        // 去重並返回所有成員
        const allMembers = [...managers]
        members.forEach((member: User) => {
          if (!allMembers.find(m => m.id === member.id)) {
            allMembers.push(member)
          }
        })
        
        return allMembers
      } catch (error) {
        console.error('獲取群組成員失敗:', error)
        return []
      }
    },
    enabled: !!formData.group && !!currentUser
  })

  // 獲取活動
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async (): Promise<Event[]> => {
      try {
        const response = await axios.get('/api/v1/events/')
        return Array.isArray(response.data.results) ? response.data.results : response.data
      } catch (error) {
        console.error('獲取活動失敗:', error)
        return []
      }
    },
    enabled: !!currentUser
  })

  // 創建支出記錄
  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/v1/expenses/', data)
      return response.data
    },
    onSuccess: (data) => {
      navigate(`/transactions/${data.id}`)
    },
    onError: (error: any) => {
      console.error('創建支出記錄失敗:', error)
      alert('創建支出記錄失敗，請檢查輸入內容')
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 處理群組選擇變化，重置分帳設定
  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const groupId = e.target.value
    setFormData(prev => ({
      ...prev,
      group: groupId,
      split_type: 'NONE',
      split_participants: []
    }))
  }

  // 處理活動選擇變化，重置分帳設定
  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const eventId = e.target.value
    setFormData(prev => ({
      ...prev,
      event: eventId,
      split_type: 'NONE',
      split_participants: []
    }))
  }

  // 檢查是否可以分帳
  const canSplit = (): boolean => {
    if (formData.type !== 'EXPENSE') return false
    if (!formData.event || !formData.group) return false
    
    // ADMIN 用戶可以使用所有分帳功能，不受活動權限限制
    if (currentUser?.role === 'ADMIN') return true
    
    const selectedEvent = events.find(e => e.id.toString() === formData.event.toString())
    if (!selectedEvent) return false
    
    return selectedEvent.allow_split && selectedEvent.status === 'ACTIVE' && selectedEvent.enabled
  }

  // 處理分帳類型變化
  const handleSplitTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const splitType = e.target.value as 'NONE' | 'AVERAGE' | 'RATIO' | 'FIXED'
    setFormData(prev => {
      const newData = {
        ...prev,
        split_type: splitType,
        split_participants: splitType === 'NONE' ? [] : prev.split_participants,
        split_data: splitType === 'NONE' ? [] : prev.split_data
      }
      
      // 重新計算分攤金額
      if (splitType !== 'NONE') {
        newData.split_data = calculateSplitAmounts(newData)
      }
      
      return newData
    })
  }

  // 處理參與者選擇
  const handleParticipantToggle = (userId: number) => {
    setFormData(prev => {
      const isCurrentlySelected = prev.split_participants.includes(userId)
      const newParticipants = isCurrentlySelected
        ? prev.split_participants.filter(id => id !== userId)
        : [...prev.split_participants, userId]
      
      // 更新分攤資料
      let newSplitData = [...prev.split_data]
      
      if (isCurrentlySelected) {
        // 移除參與者
        newSplitData = newSplitData.filter(split => split.user_id !== userId)
      } else {
        // 添加參與者，根據分攤類型設定初始值
        const defaultValue = prev.split_type === 'RATIO' ? 1 : 
                           prev.split_type === 'FIXED' ? 0 : 1
        newSplitData.push({
          user_id: userId,
          value: defaultValue,
          calculated_amount: 0
        })
      }
      
      const newData = {
        ...prev,
        split_participants: newParticipants,
        split_data: newSplitData
      }
      
      // 重新計算分攤金額
      newData.split_data = calculateSplitAmounts(newData)
      
      return newData
    })
  }

  // 計算分攤金額
  const calculateSplitAmounts = (data: TransactionForm): SplitData[] => {
    const totalAmount = parseFloat(data.amount) || 0
    const { split_type, split_data } = data
    
    if (totalAmount === 0 || split_data.length === 0) {
      return split_data.map(split => ({ ...split, calculated_amount: 0 }))
    }
    
    return split_data.map(split => {
      let calculated_amount = 0
      
      switch (split_type) {
        case 'AVERAGE':
          calculated_amount = totalAmount / split_data.length
          break
        case 'RATIO':
          const totalRatio = split_data.reduce((sum, s) => sum + s.value, 0)
          calculated_amount = totalRatio > 0 ? (totalAmount * split.value) / totalRatio : 0
          break
        case 'FIXED':
          calculated_amount = split.value
          break
        default:
          calculated_amount = 0
      }
      
      return {
        ...split,
        calculated_amount: Math.round(calculated_amount * 100) / 100
      }
    })
  }

  // 更新分攤值
  const handleSplitValueChange = (userId: number, value: number) => {
    setFormData(prev => {
      const newSplitData = prev.split_data.map(split => 
        split.user_id === userId ? { ...split, value } : split
      )
      
      const newData = {
        ...prev,
        split_data: newSplitData
      }
      
      // 重新計算分攤金額
      newData.split_data = calculateSplitAmounts(newData)
      
      return newData
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser) return
    
    // 驗證必填欄位
    if (!formData.amount || !formData.category) {
      alert('請填寫所有必填欄位')
      return
    }

    // 檢查已結束活動的權限
    if (formData.event) {
      const selectedEvent = events.find(e => e.id.toString() === formData.event.toString())
      if (selectedEvent && selectedEvent.status !== 'ACTIVE') {
        // 只有活動管理者和超級管理者可以在已結束的活動中新增支出
        if (!selectedEvent.is_user_manager && currentUser.role !== 'ADMIN') {
          alert('活動已結束，只有活動管理者和超級管理者可以新增支出')
          return
        }
      }
    }

    // 準備提交數據
    const submitData: any = {
      amount: parseFloat(formData.amount),
      type: formData.type,
      date: formData.date,
      description: formData.description,
      images: formData.images,
      category: formData.category,
      user: currentUser.id,
      event: formData.event || null,
      group: formData.group || null
    }

    // 如果是支出且有分帳設定，添加分帳資訊
    if (formData.type === 'EXPENSE' && formData.split_type !== 'NONE' && formData.split_data.length > 0) {
      submitData.split_type = formData.split_type
      submitData.split_participants = formData.split_data.map(split => ({
        user_id: split.user_id,
        split_value: split.value,
        calculated_amount: split.calculated_amount
      }))
    }

    createTransactionMutation.mutate(submitData)
  }

  const handleImageAdd = () => {
    const url = prompt('請輸入圖片URL:')
    if (url) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url]
      }))
    }
  }

  const handleImageRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
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
      <div className="transaction-new-container">
        <div className="page-header">
          <button 
            className="back-button"
            onClick={() => navigate('/transactions')}
          >
            ← 返回
          </button>
          <h1>➕ 新增{formData.type === 'EXPENSE' ? '支出' : '收入'}記錄</h1>
        </div>

        <form onSubmit={handleSubmit} className="transaction-form">
          <div className="form-section">
            <h2>基本資訊</h2>
            
            <div className="form-group">
              <label>類型 *</label>
              <div className="type-toggle">
                <button
                  type="button"
                  className={`type-btn ${formData.type === 'EXPENSE' ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, type: 'EXPENSE' }))}
                >
                  💸 支出
                </button>
                <button
                  type="button"
                  className={`type-btn ${formData.type === 'INCOME' ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, type: 'INCOME' }))}
                >
                  💰 收入
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="amount">金額 *</label>
              <div className="amount-input">
                <span className="currency">NT$</span>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="date">日期時間 *</label>
              <input
                type="datetime-local"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">分類 *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">請選擇分類</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">描述</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="詳細描述這筆記錄..."
                rows={3}
              />
            </div>
          </div>

          <div className="form-section">
            <h2>關聯資訊</h2>
            
            <div className="form-group">
              <label htmlFor="group">群組</label>
              <select
                id="group"
                name="group"
                value={formData.group}
                onChange={handleGroupChange}
              >
                <option value="">無</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="event">活動</label>
              <select
                id="event"
                name="event"
                value={formData.event}
                onChange={handleEventChange}
              >
                <option value="">無</option>
                {events.map(event => {
                  const canCreateExpense = event.status === 'ACTIVE' || 
                    event.is_user_manager || 
                    currentUser?.role === 'ADMIN'
                  
                  return (
                    <option 
                      key={event.id} 
                      value={event.id}
                      disabled={!canCreateExpense}
                    >
                      {event.name}
                      {currentUser?.role === 'ADMIN' ? ' 👑' : ''}
                      {event.is_user_manager ? ' 🔧' : ''}
                      {event.allow_split ? ' 🔄' : ''}
                      {event.status === 'COMPLETED' ? ' (已完成)' : ''}
                      {event.status === 'CANCELLED' ? ' (已取消)' : ''}
                      {!event.enabled ? ' (已停用)' : ''}
                      {!canCreateExpense ? ' 🚫' : ''}
                    </option>
                  )
                })}
              </select>
              <small className="form-hint">
                📌 只有進行中的活動、或您管理的活動可以新增支出
                {currentUser?.role === 'ADMIN' && ' (系統管理員可新增支出到任何活動)'}
              </small>
            </div>
          </div>

          {/* 分帳設定 */}
          {canSplit() && (
            <div className="form-section">
              <h2>
                💰 分帳設定
                {currentUser?.role === 'ADMIN' && (
                  <span className="admin-badge">👑 管理員權限</span>
                )}
              </h2>
              
              <div className="form-group">
                <label htmlFor="split_type">分帳類型</label>
                <select
                  id="split_type"
                  name="split_type"
                  value={formData.split_type}
                  onChange={handleSplitTypeChange}
                >
                  <option value="NONE">不分帳</option>
                  <option value="AVERAGE">平均分攤</option>
                  <option value="RATIO">比例分攤</option>
                  <option value="FIXED">固定金額</option>
                </select>
              </div>

              {formData.split_type !== 'NONE' && groupMembers.length > 0 && (
                <>
                  <div className="form-group">
                    <label>參與者選擇</label>
                    <div className="participants-selection">
                      {groupMembers.map(member => (
                        <label key={member.id} className="participant-checkbox">
                          <input
                            type="checkbox"
                            checked={formData.split_participants.includes(member.id)}
                            onChange={() => handleParticipantToggle(member.id)}
                          />
                          <span className="participant-name">{member.name}</span>
                          <span className="participant-username">@{member.username}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {formData.split_participants.length > 0 && (
                    <div className="form-group">
                      <label>分攤詳情設定</label>
                      <div className="split-details-editor">
                        <div className="editor-header">
                          <span>參與者</span>
                          <span>
                            {formData.split_type === 'AVERAGE' ? '比例' :
                             formData.split_type === 'RATIO' ? '比例' :
                             formData.split_type === 'FIXED' ? '金額 (NT$)' : '值'}
                          </span>
                          <span>應付金額</span>
                        </div>
                        
                        {formData.split_data.map(splitItem => {
                          const member = groupMembers.find(m => m.id === splitItem.user_id)
                          if (!member) return null
                          
                          return (
                            <div key={splitItem.user_id} className="split-detail-row">
                              <div className="participant-info">
                                {member.name}
                                <span className="participant-username">@{member.username}</span>
                              </div>
                              
                              <div className="value-input">
                                {formData.split_type === 'AVERAGE' ? (
                                  <span className="fixed-value">1/{formData.split_participants.length}</span>
                                ) : (
                                  <input
                                    type="number"
                                    value={splitItem.value}
                                    onChange={(e) => handleSplitValueChange(splitItem.user_id, parseFloat(e.target.value) || 0)}
                                    min="0"
                                    step={formData.split_type === 'RATIO' ? '0.1' : '1'}
                                    placeholder={formData.split_type === 'RATIO' ? '1.0' : '0'}
                                  />
                                )}
                              </div>
                              
                              <div className="calculated-amount">
                                NT$ {splitItem.calculated_amount.toLocaleString()}
                              </div>
                            </div>
                          )
                        })}
                        
                        <div className="split-total-row">
                          <div>總計</div>
                          <div>
                            {formData.split_type === 'RATIO' && 
                              `總比例: ${formData.split_data.reduce((sum, s) => sum + s.value, 0).toFixed(1)}`
                            }
                          </div>
                          <div>
                            NT$ {formData.split_data.reduce((sum, s) => sum + s.calculated_amount, 0).toLocaleString()}
                          </div>
                        </div>
                        
                        {formData.amount && (
                          <div className="split-summary">
                            <div className="summary-item">
                              <span>總支出: NT$ {parseFloat(formData.amount).toLocaleString()}</span>
                            </div>
                            <div className="summary-item">
                              <span>已分攤: NT$ {formData.split_data.reduce((sum, s) => sum + s.calculated_amount, 0).toLocaleString()}</span>
                            </div>
                            {Math.abs(parseFloat(formData.amount) - formData.split_data.reduce((sum, s) => sum + s.calculated_amount, 0)) > 0.01 && (
                              <div className="summary-item warning">
                                <span>差額: NT$ {(parseFloat(formData.amount) - formData.split_data.reduce((sum, s) => sum + s.calculated_amount, 0)).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {formData.split_type !== 'NONE' && !formData.group && (
                <div className="split-warning">
                  ⚠️ 請先選擇群組才能設定分帳
                </div>
              )}

              {formData.split_type !== 'NONE' && formData.group && groupMembers.length === 0 && (
                <div className="split-warning">
                  ⚠️ 該群組沒有可用的成員
                </div>
              )}
            </div>
          )}

          <div className="form-section">
            <h2>附件圖片</h2>
            
            <div className="images-section">
              <div className="images-list">
                {formData.images.map((image, index) => (
                  <div key={index} className="image-item">
                    <img src={image} alt={`附件 ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => handleImageRemove(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="add-image-btn"
                onClick={handleImageAdd}
              >
                + 新增圖片
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/transactions')}
            >
              取消
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={createTransactionMutation.isPending}
            >
              {createTransactionMutation.isPending ? '處理中...' : '創建記錄'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default TransactionNew