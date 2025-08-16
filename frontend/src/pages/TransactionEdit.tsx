import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
}

interface Transaction {
  id: number
  amount: string
  type: 'EXPENSE' | 'INCOME'
  date: string
  description: string
  images: string[]
  category: Category
  user: User
  event?: Event
  group?: Group
  can_user_edit: boolean
  created_at: string
  updated_at: string
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
}

const TransactionEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formData, setFormData] = useState<TransactionForm>({
    amount: '',
    type: 'EXPENSE',
    date: '',
    description: '',
    images: [],
    category_id: '',
    event_id: '',
    group_id: ''
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

  // 獲取交易記錄
  const { data: transaction, isLoading: transactionLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: async (): Promise<Transaction> => {
      const response = await axios.get(`/api/v1/expenses/${id}/`)
      return response.data
    },
    enabled: !!id && !!currentUser
  })

  // 當 transaction 數據載入完成後，設定表單資料
  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: Math.abs(parseFloat(transaction.amount)).toString(),
        type: transaction.type,
        date: new Date(transaction.date).toISOString().slice(0, 16),
        description: transaction.description,
        images: transaction.images,
        category_id: transaction.category.id,
        event_id: transaction.event?.id || '',
        group_id: transaction.group?.id || ''
      })
    }
  }, [transaction])

  // 獲取分類
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
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
    queryFn: async () => {
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

  // 獲取活動
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
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

  // 更新交易記錄
  const updateTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/api/v1/expenses/${id}/`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction', id] })
      navigate(`/transactions/${id}`)
    },
    onError: (error: any) => {
      console.error('更新交易記錄失敗:', error)
      alert('更新失敗，請檢查輸入內容')
    }
  })

  const canEditTransaction = (): boolean => {
    if (!currentUser || !transaction) return false
    if (currentUser.role === 'ADMIN') return true
    return transaction.user.id === currentUser.id
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser || !transaction) return
    
    // 驗證必填欄位
    if (!formData.amount || !formData.category_id || formData.category_id === 0) {
      alert('請填寫所有必填欄位（金額和分類為必填）')
      return
    }

    // 準備提交資料（使用正確的欄位名稱）
    const submitData = {
      amount: formData.type === 'EXPENSE' ? -Math.abs(parseFloat(formData.amount)) : Math.abs(parseFloat(formData.amount)),
      type: formData.type,
      date: formData.date,
      description: formData.description,
      images: formData.images,
      category_id: parseInt(formData.category_id.toString()),  // 必填欄位，直接轉換為數字
      event_id: formData.event_id ? parseInt(formData.event_id.toString()) : null,  // 改用 event_id
      group_id: formData.group_id ? parseInt(formData.group_id.toString()) : null   // 改用 group_id
    }

    updateTransactionMutation.mutate(submitData)
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

  if (transactionLoading) {
    return (
      <Layout user={currentUser}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#2E8B57] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">載入交易記錄中...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!transaction) {
    return (
      <Layout user={currentUser}>
        <div className="max-w-2xl mx-auto mt-16">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="text-6xl mb-4 opacity-50">📊</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">找不到交易記錄</h2>
            <p className="text-gray-600 mb-6">您要編輯的交易記錄不存在或已被刪除。</p>
            <button 
              onClick={() => navigate('/transactions')}
              className="bg-[#2E8B57] hover:bg-[#1F5F3F] text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              ← 返回交易列表
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  if (!canEditTransaction()) {
    return (
      <Layout user={currentUser}>
        <div className="max-w-2xl mx-auto mt-16">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="text-6xl mb-4 opacity-50">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">無編輯權限</h2>
            <p className="text-gray-600 mb-6">您沒有權限編輯這筆交易記錄。</p>
            <button 
              onClick={() => navigate(`/transactions/${id}`)}
              className="bg-[#2E8B57] hover:bg-[#1F5F3F] text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              ← 返回詳情頁
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={currentUser}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate(`/transactions/${id}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <span className="text-xl">←</span>
              <span className="text-sm font-medium">返回詳情</span>
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
                編輯{formData.type === 'EXPENSE' ? '支出' : '收入'}記錄
              </h1>
              <p className="text-gray-600 text-sm">修改交易記錄資訊</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本資訊 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5F9EA0] focus:border-transparent transition-all text-lg font-semibold"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5F9EA0] focus:border-transparent transition-all"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* 分類 */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">分類 *</label>
                <select
                  id="category"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5F9EA0] focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="">📝 請選擇分類</option>
                  {categories.map((category: any) => (
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5F9EA0] focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* 關聯資訊 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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
                  name="group_id"
                  value={formData.group_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5F9EA0] focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="">🚫 不指定群組</option>
                  {groups.map((group: any) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 活動 */}
              <div>
                <label htmlFor="event" className="block text-sm font-medium text-gray-700 mb-2">
                  🎉 相關活動
                </label>
                <select
                  id="event"
                  name="event_id"
                  value={formData.event_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5F9EA0] focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="">🚫 不指定活動</option>
                  {events.map((event: any) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 附件圖片 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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
            </div>
          </div>

          {/* 表單操作 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => navigate(`/transactions/${id}`)}
                className="flex-1 sm:flex-none sm:px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={updateTransactionMutation.isPending}
                className="flex-1 px-8 py-3 bg-[#2E8B57] hover:bg-[#1F5F3F] disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                {updateTransactionMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>更新中...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>更新{formData.type === 'EXPENSE' ? '支出' : '收入'}記錄</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default TransactionEdit