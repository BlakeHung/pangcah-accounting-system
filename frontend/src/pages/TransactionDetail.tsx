import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import Layout from '../components/Layout'
import './TransactionDetail.css'

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
        <div className="loading">載入中...</div>
      </Layout>
    )
  }

  if (error || !transaction) {
    return (
      <Layout user={currentUser}>
        <div className="error-container">
          <h2>找不到支出記錄</h2>
          <p>您要查看的支出記錄不存在或已被刪除。</p>
          <button onClick={() => navigate('/transactions')} className="back-btn">
            返回支出記錄
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={currentUser}>
      <div className="transaction-detail-container">
        {/* 頁面標題 */}
        <div className="page-header">
          <button 
            className="back-button"
            onClick={() => navigate('/transactions')}
          >
            ← 返回
          </button>
          <h1>
            {transaction.type === 'EXPENSE' ? '💸' : '💰'} 
            {getTypeDisplay(transaction.type)}記錄詳情
          </h1>
          {canManageTransaction() && (
            <div className="header-actions">
              <button 
                className="edit-btn"
                onClick={() => navigate(`/transactions/${id}/edit`)}
              >
                編輯
              </button>
              <button 
                className="delete-btn"
                onClick={handleDelete}
                disabled={deleteTransactionMutation.isPending}
              >
                {deleteTransactionMutation.isPending ? '刪除中...' : '刪除'}
              </button>
            </div>
          )}
        </div>

        {/* 基本資訊卡片 */}
        <div className="info-card main-info">
          <div className="amount-section">
            <div className="amount-label">金額</div>
            <div className={`amount ${transaction.type.toLowerCase()}`}>
              {transaction.type === 'EXPENSE' ? '-' : '+'}NT$ {parseFloat(transaction.amount).toLocaleString()}
            </div>
          </div>
          
          <div className="basic-info">
            <div className="info-row">
              <span className="label">📂 分類:</span>
              <span className="value">{transaction.category.name}</span>
            </div>
            <div className="info-row">
              <span className="label">📅 日期:</span>
              <span className="value">{new Date(transaction.date).toLocaleString()}</span>
            </div>
            <div className="info-row">
              <span className="label">👤 記錄者:</span>
              <span className="value">{transaction.user.name}</span>
            </div>
            {transaction.group && (
              <div className="info-row">
                <span className="label">👥 群組:</span>
                <span className="value">{transaction.group.name}</span>
              </div>
            )}
            {transaction.event && (
              <div className="info-row">
                <span className="label">🎉 活動:</span>
                <span className="value">{transaction.event.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* 描述 */}
        {transaction.description && (
          <div className="info-card">
            <h3>📝 描述</h3>
            <p className="description">{transaction.description}</p>
          </div>
        )}


        {/* 費用分攤 */}
        {transaction.type === 'EXPENSE' && transaction.event && (
          <div className="info-card split-card">
            <div className="split-header">
              <h3>💰 費用分攤</h3>
              {transaction.can_user_edit && (
                <div className="split-actions">
                  <button 
                    className="auto-split-btn"
                    onClick={() => autoSplitMutation.mutate()}
                    disabled={autoSplitMutation.isPending}
                  >
                    平均分攤
                  </button>
                  <button 
                    className="edit-split-btn"
                    onClick={openSplitModal}
                  >
                    調整分攤
                  </button>
                </div>
              )}
            </div>

            {transaction.splits && transaction.splits.length > 0 ? (
              <div className="splits-list">
                <div className="split-summary">
                  <div className="summary-item">
                    <span className="summary-label">總金額:</span>
                    <span className="summary-value">NT$ {parseFloat(transaction.amount).toLocaleString()}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">分攤總計:</span>
                    <span className="summary-value">NT$ {transaction.split_total.toLocaleString()}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">參與人數:</span>
                    <span className="summary-value">{transaction.splits.length} 人</span>
                  </div>
                </div>

                <div className="splits-details">
                  {transaction.splits.map((split, index) => (
                    <div key={split.id} className="split-item">
                      <div className="split-participant">
                        <span className="participant-name">
                          {split.participant.name || split.participant.username}
                        </span>
                        <span className="split-type">
                          {getSplitTypeDisplay(split.split_type)}
                        </span>
                        {split.is_adjusted && (
                          <span className="adjusted-badge">已調整</span>
                        )}
                      </div>
                      <div className="split-amount">
                        NT$ {split.calculated_amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-splits">
                <p>此支出尚未設置分攤</p>
                {transaction.can_user_edit && (
                  <button 
                    className="setup-split-btn"
                    onClick={() => autoSplitMutation.mutate()}
                    disabled={autoSplitMutation.isPending}
                  >
                    設置平均分攤
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 附件圖片 */}
        {transaction.images && transaction.images.length > 0 && (
          <div className="info-card">
            <h3>📷 附件圖片</h3>
            <div className="images-grid">
              {transaction.images.map((image, index) => (
                <div 
                  key={index} 
                  className="image-item"
                  onClick={() => setShowImageModal(image)}
                >
                  <img src={image} alt={`附件 ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 時間記錄 */}
        <div className="info-card">
          <h3>🕐 時間記錄</h3>
          <div className="time-info">
            <div className="info-row">
              <span className="label">創建時間:</span>
              <span className="value">{new Date(transaction.created_at).toLocaleString()}</span>
            </div>
            <div className="info-row">
              <span className="label">最後更新:</span>
              <span className="value">{new Date(transaction.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 圖片模態框 */}
        {showImageModal && (
          <div className="image-modal" onClick={() => setShowImageModal(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <img src={showImageModal} alt="放大圖片" />
              <button 
                className="close-modal"
                onClick={() => setShowImageModal(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* 分攤編輯模態框 */}
        {showSplitModal && (
          <div className="modal-overlay" onClick={() => setShowSplitModal(false)}>
            <div className="modal-content split-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>調整費用分攤</h3>
                <button 
                  className="close-modal"
                  onClick={() => setShowSplitModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
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

              <div className="modal-footer">
                <button 
                  className="btn-outline"
                  onClick={() => setShowSplitModal(false)}
                >
                  取消
                </button>
                <button 
                  className="btn-primary"
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