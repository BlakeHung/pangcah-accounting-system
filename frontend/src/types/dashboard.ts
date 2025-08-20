export interface DashboardConfig {
  theme: 'light' | 'dark' | 'auto'
  primaryColor: string
  secondaryColor: string
  chartTypes: {
    incomeExpenseTrend: boolean
    categoryPie: boolean
    groupComparison: boolean
    monthlyComparison: boolean
  }
  layout: Array<{
    id: string
    position: number
    visible: boolean
    size: 'small' | 'medium' | 'large'
  }>
  alerts: {
    expenseLimit: {
      enabled: boolean
      amount: number
      period: 'daily' | 'weekly' | 'monthly'
    }
    incomeGoal: {
      enabled: boolean
      amount: number
      period: 'monthly' | 'yearly'
    }
    unusualSpending: {
      enabled: boolean
      threshold: number // 超過平均的百分比
    }
  }
}

export interface AlertNotification {
  id: string
  type: 'expense_limit' | 'income_goal' | 'unusual_spending'
  title: string
  message: string
  level: 'info' | 'warning' | 'error'
  timestamp: string
  read: boolean
  data?: any
}

export interface FinancialGoal {
  id: string
  name: string
  type: 'income' | 'expense' | 'saving'
  targetAmount: number
  currentAmount: number
  period: 'monthly' | 'yearly'
  startDate: string
  endDate: string
  category?: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DashboardWidget {
  id: string
  type: 'summary' | 'chart' | 'alert' | 'goal'
  title: string
  component: string
  props?: Record<string, any>
  position: number
  size: 'small' | 'medium' | 'large'
  visible: boolean
}