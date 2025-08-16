import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import Layout from '../components/Layout'
import { uploadImage, uploadMultipleImages, getOptimizedUrl } from '../utils/cloudinary'

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
  category_id: number | ''
  event_id: number | ''
  group_id: number | ''
  split_type: 'NONE' | 'AVERAGE' | 'RATIO' | 'FIXED'
  split_participants: number[]
  split_data: SplitData[]
}

const TransactionNew: React.FC = () => {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  
  // 獲取當前時間（本地時間）
  const getCurrentLocalTime = () => {
    const now = new Date()
    // 取得本地時間的年月日時分
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }
  
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [formData, setFormData] = useState<TransactionForm>({
    amount: '',
    type: 'EXPENSE',
    date: getCurrentLocalTime(), // 使用本地時間
    description: '',
    images: [],
    category_id: '',
    event_id: '',
    group_id: '',
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
    queryKey: ['group-members', formData.group_id],
    queryFn: async (): Promise<User[]> => {
      if (!formData.group_id) return []
      try {
        const response = await axios.get(`/api/v1/groups/${formData.group_id}/`)
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
    enabled: !!formData.group_id && !!currentUser
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
      group: groupId === '' ? '' : parseInt(groupId),
      split_type: 'NONE',
      split_participants: []
    }))
  }

  // 處理活動選擇變化，重置分帳設定
  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const eventId = e.target.value
    setFormData(prev => ({
      ...prev,
      event: eventId === '' ? '' : parseInt(eventId),
      split_type: 'NONE',
      split_participants: []
    }))
  }

  // 檢查是否可以分帳
  const canSplit = (): boolean => {
    if (formData.type !== 'EXPENSE') return false
    if (!formData.event_id || !formData.group_id) return false
    
    // ADMIN 用戶可以使用所有分帳功能，不受活動權限限制
    if (currentUser?.role === 'ADMIN') return true
    
    const selectedEvent = events.find(e => e.id.toString() === formData.event_id.toString())
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
    if (!formData.amount || !formData.category_id || formData.category_id === 0) {
      alert('請填寫所有必填欄位（金額和分類為必填）')
      return
    }

    // 檢查已結束活動的權限
    if (formData.event_id) {
      const selectedEvent = events.find(e => e.id.toString() === formData.event_id.toString())
      if (selectedEvent && selectedEvent.status !== 'ACTIVE') {
        // 只有活動管理者和超級管理者可以在已結束的活動中新增支出
        if (!(selectedEvent as any).is_user_manager && currentUser.role !== 'ADMIN') {
          alert('活動已結束，只有活動管理者和超級管理者可以新增支出')
          return
        }
      }
    }

    // 準備提交數據（使用正確的欄位名稱）
    const submitData: any = {
      amount: formData.type === 'EXPENSE' ? -Math.abs(parseFloat(formData.amount)) : Math.abs(parseFloat(formData.amount)),
      type: formData.type,
      date: formData.date,
      description: formData.description,
      images: formData.images,
      category_id: parseInt(formData.category_id.toString()),  // 必填欄位，直接轉換為數字
      user: currentUser.id,
      event_id: formData.event_id ? parseInt(formData.event_id.toString()) : null,  // 改用 event_id
      group_id: formData.group_id ? parseInt(formData.group_id.toString()) : null   // 改用 group_id
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

  // 使用 Cloudinary 上傳圖片
  const handleImageAdd = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files || files.length === 0) return
      
      setUploadingImages(true)
      setUploadProgress(0)
      
      try {
        const uploadedUrls: string[] = []
        
        // 上傳每個檔案
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          
          // 檢查檔案大小（限制 10MB）
          if (file.size > 10 * 1024 * 1024) {
            alert(`檔案 ${file.name} 超過 10MB 限制`)
            continue
          }
          
          const result = await uploadImage(file, (progress) => {
            // 計算整體進度
            const overallProgress = Math.round(((i + progress / 100) / files.length) * 100)
            setUploadProgress(overallProgress)
          })
          
          uploadedUrls.push(result.secure_url)
        }
        
        // 更新表單資料
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls]
        }))
        
        alert(`成功上傳 ${uploadedUrls.length} 張圖片`)
      } catch (error) {
        console.error('圖片上傳失敗:', error)
        alert('圖片上傳失敗，請稍後再試')
      } finally {
        setUploadingImages(false)
        setUploadProgress(0)
      }
    }
    
    input.click()
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
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#2E8B57] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">載入中...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={currentUser}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate('/transactions')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <span className="text-xl">←</span>
              <span className="text-sm font-medium">返回列表</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
              formData.type === 'EXPENSE' ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {formData.type === 'EXPENSE' ? '💸' : '💰'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                新增{formData.type === 'EXPENSE' ? '支出' : '收入'}記錄
              </h1>
              <p className="text-gray-600 text-sm">填寫以下資訊來記錄您的交易</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本資訊 */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-xl">📝</span>
              基本資訊
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 類型選擇 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">交易類型 *</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'EXPENSE' }))}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all duration-200 ${
                      formData.type === 'EXPENSE' 
                        ? 'border-red-500 bg-red-50 text-red-700' 
                        : 'border-gray-200 bg-white text-gray-600 hover:border-red-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">💸</div>
                    <div className="font-semibold">支出</div>
                    <div className="text-xs opacity-75">費用、購買等</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'INCOME' }))}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all duration-200 ${
                      formData.type === 'INCOME' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 bg-white text-gray-600 hover:border-green-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">💰</div>
                    <div className="font-semibold">收入</div>
                    <div className="text-xs opacity-75">薪水、獎金等</div>
                  </button>
                </div>
              </div>

              {/* 金額 */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">金額 *</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                    NT$
                  </div>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="1"
                    min="0"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all text-lg font-semibold"
                  />
                </div>
              </div>

              {/* 日期時間 */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  日期時間 * <span className="text-xs text-gray-500 font-normal">(GMT+8 台北時間)</span>
                </label>
                <input
                  type="datetime-local"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* 分類 */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">分類 *</label>
                <select
                  id="category"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="">📝 請選擇分類</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 描述 */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="詳細描述這筆記錄..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* 關聯資訊 */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-xl">🔗</span>
              關聯資訊
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 群組 */}
              <div>
                <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-2">
                  👥 所屬群組
                </label>
                <select
                  id="group"
                  name="group"
                  value={formData.group_id}
                  onChange={handleGroupChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="">🚫 不指定群組</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">可選擇群組來進行分帳管理</p>
              </div>

              {/* 活動 */}
              <div>
                <label htmlFor="event" className="block text-sm font-medium text-gray-700 mb-2">
                  🎉 相關活動
                </label>
                <select
                  id="event"
                  name="event"
                  value={formData.event_id}
                  onChange={handleEventChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="">🚫 不指定活動</option>
                  {events.map(event => {
                    const canCreateExpense = event.status === 'ACTIVE' || 
                      (event as any).is_user_manager || 
                      currentUser?.role === 'ADMIN'
                    
                    return (
                      <option 
                        key={event.id} 
                        value={event.id}
                        disabled={!canCreateExpense}
                        className={!canCreateExpense ? 'text-gray-400' : ''}
                      >
                        {event.name}
                        {event.status === 'COMPLETED' ? ' (已完成)' : ''}
                        {event.status === 'CANCELLED' ? ' (已取消)' : ''}
                        {!event.enabled ? ' (已停用)' : ''}
                      </option>
                    )
                  })}
                </select>
                {(formData.event_id && events.find(e => e.id.toString() === formData.event_id.toString())?.allow_split) && (
                  <div className="mt-2 p-2 rounded-lg bg-blue-50">
                    <p className="text-xs flex items-center gap-1 text-blue-600">
                      🔄 此活動支持分帳功能
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">關聯特定活動可启用分帳功能</p>
              </div>
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

              {formData.split_type !== 'NONE' && !formData.group_id && (
                <div className="split-warning">
                  ⚠️ 請先選擇群組才能設定分帳
                </div>
              )}

              {formData.split_type !== 'NONE' && formData.group_id && groupMembers.length === 0 && (
                <div className="split-warning">
                  ⚠️ 該群組沒有可用的成員
                </div>
              )}
            </div>
          )}

          {/* 附件圖片 */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-xl">🖼️</span>
              附件圖片
            </h2>
            
            <div className="space-y-4">
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={getOptimizedUrl(image, { width: 200, height: 200, quality: 'auto' })} 
                        alt={`附件 ${index + 1}`} 
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                type="button"
                onClick={handleImageAdd}
                disabled={uploadingImages}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#2E8B57] hover:text-[#2E8B57] transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingImages ? (
                  <>
                    <div className="w-8 h-8 border-2 border-[#2E8B57] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">上傳中... {uploadProgress}%</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl">📤</span>
                    <span>點擊上傳圖片</span>
                    <span className="text-xs text-gray-500">支援 JPG, PNG, PDF (最大 10MB)</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                圖片將安全儲存在 Cloudinary 雲端空間<br/>
                支援批次上傳多張圖片
              </p>
            </div>
          </div>

          {/* 表單操作 */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => navigate('/transactions')}
                className="secondary flex-1 sm:flex-none sm:px-6 py-3"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={createTransactionMutation.isPending}
                className="flex-1 px-8 py-3 flex items-center justify-center gap-2"
              >
                {createTransactionMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>處理中...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>創建{formData.type === 'EXPENSE' ? '支出' : '收入'}記錄</span>
                  </>
                )}
              </button>
            </div>
            {(formData.amount && formData.category_id) && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">預覽：</span>
                  <span className={formData.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'}>
                    {formData.type === 'EXPENSE' ? '-' : '+'}NT$ {parseFloat(formData.amount || '0').toLocaleString()}
                  </span>
                  <span className="mx-2">·</span>
                  <span>{categories.find(c => c.id.toString() === formData.category_id.toString())?.name}</span>
                  {formData.description && (
                    <>
                      <span className="mx-2">·</span>
                      <span>{formData.description}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default TransactionNew