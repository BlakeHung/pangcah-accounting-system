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

interface ExpenseSplit {
  id: number
  participant: User
  split_type: 'AVERAGE' | 'RATIO' | 'FIXED' | 'SELECTIVE'
  split_value: number
  calculated_amount: number
  is_adjusted: boolean
  can_user_adjust: boolean
}

interface Transaction {
  id: number
  amount: string
  type: 'EXPENSE' | 'INCOME'
  date: string
  description: string
  images: string[]
  category: Category
  category_name: string
  user: User
  event?: Event
  event_name?: string
  group?: Group
  group_name?: string
  splits: ExpenseSplit[]
  split_participants: User[]
  can_user_edit: boolean
  split_total: number
  created_at: string
  updated_at: string
}

const TransactionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showSplitModal, setShowSplitModal] = useState(false)
  const [editingSplits, setEditingSplits] = useState<ExpenseSplit[]>([])
  const [splitType, setSplitType] = useState<'AVERAGE' | 'RATIO' | 'FIXED'>('AVERAGE')
  const [showImageModal, setShowImageModal] = useState<string | null>(null)

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

  // 獲取支出記錄詳情
  const { data: transaction, isLoading, error } = useQuery({
    queryKey: ['transaction', id],
    queryFn: async (): Promise<Transaction> => {
      const response = await axios.get(`/api/v1/expenses/${id}/`)
      return response.data
    },
    enabled: !!id && !!currentUser
  })


  // 調整分攤
  const adjustSplitMutation = useMutation({
    mutationFn: async (splits: any[]) => {
      const response = await axios.post(`/api/v1/expenses/${id}/adjust_splits/`, {
        splits: splits
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense', id] })
      setShowSplitModal(false)
    }
  })

  // 自動重新計算分攤
  const autoSplitMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`/api/v1/expenses/${id}/auto_split/`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense', id] })
    }
  })

  // 刪除支出記錄
  const deleteTransactionMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`/api/v1/expenses/${id}/`)
    },
    onSuccess: () => {
      navigate('/transactions')
    }
  })

  const handleDelete = () => {
    if (!transaction) return
    
    const confirmMessage = `確定要刪除這筆${transaction.type === 'EXPENSE' ? '支出' : '收入'}記錄嗎？`
    if (window.confirm(confirmMessage)) {
      deleteTransactionMutation.mutate()
    }
  }


  const openSplitModal = () => {
    if (!transaction?.splits) return
    setEditingSplits([...transaction.splits])
    setShowSplitModal(true)
  }

  const handleSplitSave = () => {
    const splitsData = editingSplits.map(split => ({
      participant_id: split.participant.id,
      split_type: split.split_type,
      split_value: split.split_value
    }))
    adjustSplitMutation.mutate(splitsData)
  }

  const updateSplitAmount = (index: number, value: number) => {
    const newSplits = [...editingSplits]
    newSplits[index] = {
      ...newSplits[index],
      split_value: value,
      calculated_amount: splitType === 'FIXED' ? value : 
                      splitType === 'RATIO' ? parseFloat(transaction?.amount || '0') * value :
                      value
    }
    setEditingSplits(newSplits)
  }

  const getSplitTypeDisplay = (type: string) => {
    switch (type) {
      case 'AVERAGE': return '平均分攤'
      case 'RATIO': return '比例分攤'
      case 'FIXED': return '固定金額'
      case 'SELECTIVE': return '選擇性分攤'
      default: return type
    }
  }

  const canManageTransaction = (): boolean => {
    if (!currentUser || !transaction) return false
    if (currentUser.role === 'ADMIN') return true
    return transaction.user.id === currentUser.id
  }



  const getTypeDisplay = (type: string) => {
    return type === 'EXPENSE' ? '支出' : '收入'
  }

  if (isLoading) {
    return (
      <Layout user={currentUser}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#2E8B57] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">載入交易詳情中...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !transaction) {
    return (
      <Layout user={currentUser}>
        <div className="max-w-2xl mx-auto mt-16">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="text-6xl mb-4 opacity-50">📊</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">找不到交易記錄</h2>
            <p className="text-gray-600 mb-6">您要查看的交易記錄不存在或已被刪除。</p>
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

  return (
    <Layout user={currentUser}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/transactions')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <span className="text-xl">←</span>
                <span className="text-sm font-medium">返回列表</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                  transaction.type === 'EXPENSE' ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {transaction.type === 'EXPENSE' ? '💸' : '💰'}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {getTypeDisplay(transaction.type)}記錄詳情
                  </h1>
                  <p className="text-gray-600 text-sm">ID: {transaction.id}</p>
                </div>
              </div>
            </div>
            {canManageTransaction() && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate(`/transactions/${id}/edit`)}
                  className="bg-[#2E8B57] hover:bg-[#1F5F3F] text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <span>✏️</span>
                  <span>編輯</span>
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={deleteTransactionMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  {deleteTransactionMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>刪除中</span>
                    </>
                  ) : (
                    <>
                      <span>🗑️</span>
                      <span>刪除</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 主資訊卡片 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 金額顯示 */}
            <div className="lg:col-span-1">
              <div className={`text-center p-6 rounded-xl ${
                transaction.type === 'EXPENSE' ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
              }`}>
                <div className="text-sm text-gray-600 mb-2">交易金額</div>
                <div className={`text-3xl font-bold ${
                  transaction.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {transaction.type === 'EXPENSE' ? '-' : '+'}NT$ {parseFloat(transaction.amount).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {transaction.type === 'EXPENSE' ? '支出' : '收入'}
                </div>
              </div>
            </div>
            
            {/* 基本資訊 */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">📂</div>
                    <div>
                      <div className="text-sm text-gray-600">分類</div>
                      <div className="font-medium">{transaction.category.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-lg">📅</div>
                    <div>
                      <div className="text-sm text-gray-600">日期</div>
                      <div className="font-medium">{new Date(transaction.date).toLocaleString('zh-TW')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-lg">👤</div>
                    <div>
                      <div className="text-sm text-gray-600">記錄者</div>
                      <div className="font-medium">{transaction.user.name || transaction.user.username}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {transaction.group && (
                    <div className="flex items-center gap-3">
                      <div className="text-lg">👥</div>
                      <div>
                        <div className="text-sm text-gray-600">群組</div>
                        <div className="font-medium">{transaction.group.name}</div>
                      </div>
                    </div>
                  )}
                  {transaction.event && (
                    <div className="flex items-center gap-3">
                      <div className="text-lg">🎉</div>
                      <div>
                        <div className="text-sm text-gray-600">活動</div>
                        <div className="font-medium">{transaction.event.name}</div>
                      </div>
                    </div>
                  )}
                  {(!transaction.group && !transaction.event) && (
                    <div className="text-gray-500 text-sm">無關聯群組或活動</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 描述 */}
        {transaction.description && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">📝</span>
              描述
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">{transaction.description}</p>
            </div>
          </div>
        )}


        {/* 費用分攤 */}
        {transaction.type === 'EXPENSE' && transaction.event && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="text-xl">💰</span>
                費用分攤
              </h3>
              {transaction.can_user_edit && (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => autoSplitMutation.mutate()}
                    disabled={autoSplitMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
                  >
                    {autoSplitMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <span>⚖️</span>
                    )}
                    <span>平均分攤</span>
                  </button>
                  <button 
                    onClick={openSplitModal}
                    className="bg-[#2E8B57] hover:bg-[#1F5F3F] text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
                  >
                    <span>✏️</span>
                    <span>調整分攤</span>
                  </button>
                </div>
              )}
            </div>

            {transaction.splits && transaction.splits.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">總金額:</span>
                      <span className="font-semibold text-gray-800">NT$ {parseFloat(transaction.amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">分攤總計:</span>
                      <span className="font-semibold text-gray-800">NT$ {transaction.split_total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">參與人數:</span>
                      <span className="font-semibold text-gray-800">{transaction.splits.length} 人</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {transaction.splits.map((split, index) => (
                    <div key={split.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#2E8B57] to-[#5F9EA0] rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {(split.participant.name || split.participant.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {split.participant.name || split.participant.username}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {getSplitTypeDisplay(split.split_type)}
                            </span>
                            {split.is_adjusted && (
                              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">已調整</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-lg text-[#2E8B57]">
                        NT$ {split.calculated_amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl opacity-60 mb-4">💰</div>
                <p className="text-gray-600 mb-4">此支出尚未設置分攤</p>
                {transaction.can_user_edit && (
                  <button 
                    className="bg-[#2E8B57] hover:bg-[#1F5F3F] text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center gap-2 mx-auto"
                    onClick={() => autoSplitMutation.mutate()}
                    disabled={autoSplitMutation.isPending}
                  >
                    {autoSplitMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <span>⚖️</span>
                    )}
                    <span>設置平均分攤</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 附件圖片 */}
        {transaction.images && transaction.images.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">📷</span>
              附件圖片
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {transaction.images.map((image, index) => (
                <div 
                  key={index} 
                  className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-gray-200 hover:border-[#2E8B57]"
                  onClick={() => setShowImageModal(image)}
                >
                  <img 
                    src={image} 
                    alt={`附件 ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 時間記錄 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-xl">🕐</span>
            時間記錄
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="text-lg">➕</div>
              <div>
                <div className="text-sm text-gray-600">創建時間</div>
                <div className="font-medium">{new Date(transaction.created_at).toLocaleString('zh-TW')}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-lg">✏️</div>
              <div>
                <div className="text-sm text-gray-600">最後更新</div>
                <div className="font-medium">{new Date(transaction.updated_at).toLocaleString('zh-TW')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 圖片模態框 */}
        {showImageModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4" onClick={() => setShowImageModal(null)}>
            <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
              <img 
                src={showImageModal} 
                alt="放大圖片" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
              <button 
                className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
                onClick={() => setShowImageModal(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* 分攤編輯模態框 */}
        {showSplitModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={() => setShowSplitModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3>調整費用分攤</h3>
                <button 
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition-colors"
                  onClick={() => setShowSplitModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <div className="split-type-selector">
                  <label>分攤方式:</label>
                  <select 
                    value={splitType} 
                    onChange={(e) => setSplitType(e.target.value as any)}
                  >
                    <option value="AVERAGE">平均分攤</option>
                    <option value="RATIO">比例分攤</option>
                    <option value="FIXED">固定金額</option>
                  </select>
                </div>

                <div className="splits-editor">
                  <div className="editor-header">
                    <span>參與者</span>
                    <span>
                      {splitType === 'AVERAGE' ? '比例' : 
                       splitType === 'RATIO' ? '比例 (%)' :
                       '金額 (NT$)'}
                    </span>
                    <span>應付金額</span>
                  </div>

                  {editingSplits.map((split, index) => (
                    <div key={split.id} className="split-editor-row">
                      <div className="participant-info">
                        {split.participant.name || split.participant.username}
                      </div>
                      <div className="amount-input">
                        {splitType === 'AVERAGE' ? (
                          <span>1/{editingSplits.length}</span>
                        ) : (
                          <input
                            type="number"
                            value={split.split_value}
                            onChange={(e) => updateSplitAmount(index, parseFloat(e.target.value) || 0)}
                            min="0"
                            step={splitType === 'RATIO' ? '0.01' : '1'}
                          />
                        )}
                      </div>
                      <div className="calculated-amount">
                        NT$ {split.calculated_amount.toLocaleString()}
                      </div>
                    </div>
                  ))}

                  <div className="total-row">
                    <div>總計</div>
                    <div></div>
                    <div>
                      NT$ {editingSplits.reduce((sum, split) => sum + split.calculated_amount, 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button 
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  onClick={() => setShowSplitModal(false)}
                >
                  取消
                </button>
                <button 
                  className="px-6 py-2 bg-[#2E8B57] hover:bg-[#1F5F3F] text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                  onClick={handleSplitSave}
                  disabled={adjustSplitMutation.isPending}
                >
                  {adjustSplitMutation.isPending ? '儲存中...' : '確認儲存'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default TransactionDetail