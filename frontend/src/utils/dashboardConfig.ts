import { DashboardConfig, AlertNotification, FinancialGoal } from '../types/dashboard'

export const defaultDashboardConfig: DashboardConfig = {
  theme: 'light',
  primaryColor: '#2E8B57',
  secondaryColor: '#5F9EA0',
  chartTypes: {
    incomeExpenseTrend: true,
    categoryPie: true,
    groupComparison: true,
    monthlyComparison: false
  },
  layout: [
    { id: 'summary-cards', position: 1, visible: true, size: 'large' },
    { id: 'income-expense-trend', position: 2, visible: true, size: 'large' },
    { id: 'category-pie', position: 3, visible: true, size: 'medium' },
    { id: 'group-comparison', position: 4, visible: true, size: 'medium' }
  ],
  alerts: {
    expenseLimit: {
      enabled: false,
      amount: 10000,
      period: 'monthly'
    },
    incomeGoal: {
      enabled: false,
      amount: 50000,
      period: 'monthly'
    },
    unusualSpending: {
      enabled: false,
      threshold: 50
    }
  }
}

// 載入儀表板設定
export const loadDashboardConfig = (): DashboardConfig => {
  try {
    const savedConfig = localStorage.getItem('dashboard_config')
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig)
      return { ...defaultDashboardConfig, ...parsed }
    }
  } catch (error) {
    console.error('載入儀表板設定失敗:', error)
  }
  return defaultDashboardConfig
}

// 保存儀表板設定
export const saveDashboardConfig = (config: DashboardConfig): boolean => {
  try {
    localStorage.setItem('dashboard_config', JSON.stringify(config))
    return true
  } catch (error) {
    console.error('保存儀表板設定失敗:', error)
    return false
  }
}

// 重置為預設設定
export const resetDashboardConfig = (): void => {
  localStorage.removeItem('dashboard_config')
}

// 載入提醒通知
export const loadAlertNotifications = (): AlertNotification[] => {
  try {
    const saved = localStorage.getItem('alert_notifications')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('載入提醒通知失敗:', error)
  }
  return []
}

// 保存提醒通知
export const saveAlertNotifications = (notifications: AlertNotification[]): void => {
  try {
    localStorage.setItem('alert_notifications', JSON.stringify(notifications))
  } catch (error) {
    console.error('保存提醒通知失敗:', error)
  }
}

// 添加新提醒
export const addAlertNotification = (notification: Omit<AlertNotification, 'id' | 'timestamp' | 'read'>): void => {
  const notifications = loadAlertNotifications()
  const newNotification: AlertNotification = {
    ...notification,
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    read: false
  }
  notifications.unshift(newNotification)
  // 只保留最近 50 條通知
  if (notifications.length > 50) {
    notifications.splice(50)
  }
  saveAlertNotifications(notifications)
}

// 標記通知為已讀
export const markNotificationAsRead = (notificationId: string): void => {
  const notifications = loadAlertNotifications()
  const notification = notifications.find(n => n.id === notificationId)
  if (notification) {
    notification.read = true
    saveAlertNotifications(notifications)
  }
}

// 清除所有通知
export const clearAllNotifications = (): void => {
  localStorage.removeItem('alert_notifications')
}


// 載入財務目標
export const loadFinancialGoals = (): FinancialGoal[] => {
  try {
    const saved = localStorage.getItem('financial_goals')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('載入財務目標失敗:', error)
  }
  return []
}

// 保存財務目標
export const saveFinancialGoals = (goals: FinancialGoal[]): void => {
  try {
    localStorage.setItem('financial_goals', JSON.stringify(goals))
  } catch (error) {
    console.error('保存財務目標失敗:', error)
  }
}

// 新增財務目標
export const addFinancialGoal = (goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'updatedAt'>): void => {
  const goals = loadFinancialGoals()
  const newGoal: FinancialGoal = {
    ...goal,
    id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  goals.push(newGoal)
  saveFinancialGoals(goals)
}

// 更新財務目標
export const updateFinancialGoal = (goalId: string, updates: Partial<FinancialGoal>): void => {
  const goals = loadFinancialGoals()
  const goalIndex = goals.findIndex(g => g.id === goalId)
  if (goalIndex !== -1) {
    goals[goalIndex] = {
      ...goals[goalIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    saveFinancialGoals(goals)
  }
}

// 刪除財務目標
export const deleteFinancialGoal = (goalId: string): void => {
  const goals = loadFinancialGoals()
  const filteredGoals = goals.filter(g => g.id !== goalId)
  saveFinancialGoals(filteredGoals)
}

// 顏色配置選項
export const colorOptions = [
  { name: '海藻綠', value: '#2E8B57' },
  { name: '天空藍', value: '#4A90E2' },
  { name: '薰衣草紫', value: '#8B7ED8' },
  { name: '珊瑚橘', value: '#FF6B6B' },
  { name: '金色', value: '#F7B731' },
  { name: '玫瑰金', value: '#E55A4E' },
  { name: '翡翠綠', value: '#27AE60' },
  { name: '深海藍', value: '#2C3E50' }
]

// 主題配置選項
export const themeOptions = [
  { value: 'light', label: '淺色主題', icon: '☀️' },
  { value: 'dark', label: '深色主題', icon: '🌙' },
  { value: 'auto', label: '自動切換', icon: '🔄' }
]

// 檢查是否需要發送提醒
export const checkAndCreateAlerts = (
  config: DashboardConfig, 
  expenses: any[], 
  currentPeriodStart: Date,
  currentPeriodEnd: Date
): void => {
  const notifications = loadAlertNotifications()
  const today = new Date().toISOString().split('T')[0]

  // 檢查支出限額
  if (config.alerts.expenseLimit.enabled) {
    const periodExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expense.type === 'EXPENSE' && 
             expenseDate >= currentPeriodStart && 
             expenseDate <= currentPeriodEnd
    })
    
    const totalExpense = periodExpenses.reduce((sum, expense) => 
      sum + Math.abs(parseFloat(String(expense.amount))), 0
    )
    
    if (totalExpense > config.alerts.expenseLimit.amount) {
      // 檢查今天是否已經有相同類型的提醒
      const hasToday = notifications.some(n => 
        n.type === 'expense_limit' && 
        n.timestamp.startsWith(today)
      )
      
      if (!hasToday) {
        addAlertNotification({
          type: 'expense_limit',
          title: '支出超標提醒',
          message: `您的${config.alerts.expenseLimit.period === 'monthly' ? '本月' : config.alerts.expenseLimit.period === 'weekly' ? '本週' : '今日'}支出 NT$ ${totalExpense.toLocaleString()} 已超過設定限額 NT$ ${config.alerts.expenseLimit.amount.toLocaleString()}`,
          level: 'warning',
          data: { amount: totalExpense, limit: config.alerts.expenseLimit.amount }
        })
      }
    }
  }

  // 檢查收入目標
  if (config.alerts.incomeGoal.enabled) {
    const periodIncome = expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expense.type === 'INCOME' && 
             expenseDate >= currentPeriodStart && 
             expenseDate <= currentPeriodEnd
    })
    
    const totalIncome = periodIncome.reduce((sum, expense) => 
      sum + Math.abs(parseFloat(String(expense.amount))), 0
    )
    
    const progress = (totalIncome / config.alerts.incomeGoal.amount) * 100
    
    // 每月檢查一次進度（當進度達到 25%, 50%, 75%, 90% 時提醒）
    const milestones = [25, 50, 75, 90]
    milestones.forEach(milestone => {
      if (progress >= milestone && progress < milestone + 10) {
        const hasThisMilestone = notifications.some(n => 
          n.type === 'income_goal' && 
          n.data?.milestone === milestone &&
          n.timestamp.startsWith(today.substring(0, 7)) // 同月份
        )
        
        if (!hasThisMilestone) {
          addAlertNotification({
            type: 'income_goal',
            title: '收入目標進度',
            message: `您的收入目標已達成 ${milestone}%（NT$ ${totalIncome.toLocaleString()} / NT$ ${config.alerts.incomeGoal.amount.toLocaleString()}）`,
            level: 'info',
            data: { amount: totalIncome, goal: config.alerts.incomeGoal.amount, milestone }
          })
        }
      }
    })
  }

  // 檢查異常支出
  if (config.alerts.unusualSpending.enabled) {
    // 計算過去 30 天的平均日支出
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expense.type === 'EXPENSE' && expenseDate >= thirtyDaysAgo
    })
    
    if (recentExpenses.length > 0) {
      const dailyExpenses = new Map<string, number>()
      
      recentExpenses.forEach(expense => {
        const date = expense.date.split('T')[0]
        const current = dailyExpenses.get(date) || 0
        dailyExpenses.set(date, current + Math.abs(parseFloat(String(expense.amount))))
      })
      
      const amounts = Array.from(dailyExpenses.values())
      const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length
      
      // 檢查今日支出
      const todayExpenses = expenses.filter(expense => 
        expense.type === 'EXPENSE' && expense.date.startsWith(today)
      )
      
      const todayTotal = todayExpenses.reduce((sum, expense) => 
        sum + Math.abs(parseFloat(String(expense.amount))), 0
      )
      
      const threshold = average * (1 + config.alerts.unusualSpending.threshold / 100)
      
      if (todayTotal > threshold) {
        const hasToday = notifications.some(n => 
          n.type === 'unusual_spending' && 
          n.timestamp.startsWith(today)
        )
        
        if (!hasToday) {
          addAlertNotification({
            type: 'unusual_spending',
            title: '異常支出提醒',
            message: `今日支出 NT$ ${todayTotal.toLocaleString()} 超過您的平均支出 ${config.alerts.unusualSpending.threshold}%`,
            level: 'warning',
            data: { todayAmount: todayTotal, averageAmount: average, threshold: config.alerts.unusualSpending.threshold }
          })
        }
      }
    }
  }
}