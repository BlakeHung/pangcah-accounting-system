import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useSnackbar } from '../contexts/SnackbarContext'

interface User {
  username: string
  name: string
  role: string
}

interface DashboardConfig {
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

const defaultConfig: DashboardConfig = {
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

const DashboardSettings: React.FC = () => {
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()
  const [user, setUser] = useState<User | null>(null)
  const [config, setConfig] = useState<DashboardConfig>(defaultConfig)
  const [activeTab, setActiveTab] = useState<'appearance' | 'layout' | 'alerts'>('appearance')

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      navigate('/login')
      return
    }
    
    setUser(JSON.parse(userData))
    loadDashboardConfig()
  }, [navigate])

  const loadDashboardConfig = () => {
    const savedConfig = localStorage.getItem('dashboard_config')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig({ ...defaultConfig, ...parsed })
      } catch (error) {
        console.error('載入儀表板設定失敗:', error)
        setConfig(defaultConfig)
      }
    }
  }

  const saveDashboardConfig = () => {
    try {
      localStorage.setItem('dashboard_config', JSON.stringify(config))
      showSnackbar('儀表板設定已保存', 'success')
    } catch (error) {
      console.error('保存儀表板設定失敗:', error)
      showSnackbar('保存設定失敗', 'error')
    }
  }

  const resetToDefault = () => {
    setConfig(defaultConfig)
    localStorage.removeItem('dashboard_config')
    showSnackbar('已重置為預設設定', 'success')
  }

  const colorOptions = [
    { name: '海藻綠', value: '#2E8B57' },
    { name: '天空藍', value: '#4A90E2' },
    { name: '薰衣草紫', value: '#8B7ED8' },
    { name: '珊瑚橘', value: '#FF6B6B' },
    { name: '金色', value: '#F7B731' },
    { name: '玫瑰金', value: '#E55A4E' }
  ]

  const themeOptions = [
    { value: 'light', label: '淺色主題', icon: '☀️' },
    { value: 'dark', label: '深色主題', icon: '🌙' },
    { value: 'auto', label: '自動切換', icon: '🔄' }
  ]

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-2xl">⚙️</span>
                儀表板設定
              </h1>
              <p className="text-gray-600">
                個人化您的儀表板體驗
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={resetToDefault}
                className="text-gray-600 hover:text-gray-800 transition-colors px-4 py-2 border border-gray-300 rounded-lg"
              >
                重置預設
              </button>
              <button
                onClick={saveDashboardConfig}
                className="bg-[#2E8B57] hover:bg-[#236B47] text-white px-6 py-2 rounded-lg transition-colors font-medium"
              >
                保存設定
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                返回儀表板
              </button>
            </div>
          </div>
        </div>

        {/* 分頁導航 */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'appearance', label: '外觀主題', icon: '🎨' },
                { key: 'layout', label: '版面配置', icon: '📊' },
                { key: 'alerts', label: '提醒設定', icon: '🚨' }
              ].map(tab => (
                <button
                  key={tab.key}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? 'border-[#2E8B57] text-[#2E8B57]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab(tab.key as any)}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 分頁內容 */}
          <div className="p-6">
            {activeTab === 'appearance' && (
              <div className="space-y-8">
                {/* 主題選擇 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">主題模式</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {themeOptions.map(theme => (
                      <button
                        key={theme.value}
                        onClick={() => setConfig(prev => ({ ...prev, theme: theme.value as any }))}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          config.theme === theme.value
                            ? 'border-[#2E8B57] bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{theme.icon}</span>
                          <div>
                            <div className="font-medium text-gray-800">{theme.label}</div>
                            <div className="text-sm text-gray-500">
                              {theme.value === 'auto' ? '根據系統設定自動切換' : theme.label}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 主色調選擇 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">主色調</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {colorOptions.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setConfig(prev => ({ ...prev, primaryColor: color.value }))}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          config.primaryColor === color.value
                            ? 'border-gray-800 scale-105'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ borderColor: config.primaryColor === color.value ? color.value : undefined }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full"
                            style={{ backgroundColor: color.value }}
                          />
                          <span className="font-medium text-gray-800">{color.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 預覽區域 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">預覽</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm border-l-4" style={{ borderColor: config.primaryColor }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">總收入</p>
                            <p className="text-2xl font-bold" style={{ color: config.primaryColor }}>
                              NT$ 125,000
                            </p>
                          </div>
                          <span className="text-3xl">💰</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: config.primaryColor }}
                          />
                          <span className="text-sm font-medium text-gray-700">主要按鈕樣式</span>
                        </div>
                        <button
                          className="px-4 py-2 rounded-lg text-white font-medium transition-colors"
                          style={{ backgroundColor: config.primaryColor }}
                        >
                          範例按鈕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">圖表顯示設定</h3>
                
                {/* 圖表開關 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800">收支趨勢圖</h4>
                        <p className="text-sm text-gray-600">顯示收入支出趨勢變化</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={config.chartTypes.incomeExpenseTrend}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            chartTypes: { ...prev.chartTypes, incomeExpenseTrend: e.target.checked }
                          }))}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800">分類圓餅圖</h4>
                        <p className="text-sm text-gray-600">支出分類比例分析</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={config.chartTypes.categoryPie}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            chartTypes: { ...prev.chartTypes, categoryPie: e.target.checked }
                          }))}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800">群組比較圖</h4>
                        <p className="text-sm text-gray-600">不同群組支出比較</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={config.chartTypes.groupComparison}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            chartTypes: { ...prev.chartTypes, groupComparison: e.target.checked }
                          }))}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800">月度對比圖</h4>
                        <p className="text-sm text-gray-600">月份間收支對比</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={config.chartTypes.monthlyComparison}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            chartTypes: { ...prev.chartTypes, monthlyComparison: e.target.checked }
                          }))}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">智慧提醒設定</h3>
                
                {/* 支出限額提醒 */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-800 flex items-center gap-2">
                        <span className="text-red-500">💸</span>
                        支出限額提醒
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        當支出超過設定金額時發送提醒
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={config.alerts.expenseLimit.enabled}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          alerts: { ...prev.alerts, expenseLimit: { ...prev.alerts.expenseLimit, enabled: e.target.checked }}
                        }))}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                  
                  {config.alerts.expenseLimit.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          限額金額
                        </label>
                        <input
                          type="number"
                          value={config.alerts.expenseLimit.amount}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            alerts: { ...prev.alerts, expenseLimit: { ...prev.alerts.expenseLimit, amount: parseInt(e.target.value) || 0 }}
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E8B57] focus:border-transparent"
                          placeholder="輸入金額"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          統計期間
                        </label>
                        <select
                          value={config.alerts.expenseLimit.period}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            alerts: { ...prev.alerts, expenseLimit: { ...prev.alerts.expenseLimit, period: e.target.value as any }}
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E8B57] focus:border-transparent"
                        >
                          <option value="daily">每日</option>
                          <option value="weekly">每週</option>
                          <option value="monthly">每月</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 收入目標提醒 */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-800 flex items-center gap-2">
                        <span className="text-green-500">💰</span>
                        收入目標提醒
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        追蹤收入目標達成進度
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={config.alerts.incomeGoal.enabled}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          alerts: { ...prev.alerts, incomeGoal: { ...prev.alerts.incomeGoal, enabled: e.target.checked }}
                        }))}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                  
                  {config.alerts.incomeGoal.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          目標金額
                        </label>
                        <input
                          type="number"
                          value={config.alerts.incomeGoal.amount}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            alerts: { ...prev.alerts, incomeGoal: { ...prev.alerts.incomeGoal, amount: parseInt(e.target.value) || 0 }}
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E8B57] focus:border-transparent"
                          placeholder="輸入目標金額"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          統計期間
                        </label>
                        <select
                          value={config.alerts.incomeGoal.period}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            alerts: { ...prev.alerts, incomeGoal: { ...prev.alerts.incomeGoal, period: e.target.value as any }}
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E8B57] focus:border-transparent"
                        >
                          <option value="monthly">每月</option>
                          <option value="yearly">每年</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 異常支出提醒 */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-800 flex items-center gap-2">
                        <span className="text-yellow-500">⚠️</span>
                        異常支出提醒
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        當支出超過平均水準時提醒
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={config.alerts.unusualSpending.enabled}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          alerts: { ...prev.alerts, unusualSpending: { ...prev.alerts.unusualSpending, enabled: e.target.checked }}
                        }))}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                    </label>
                  </div>
                  
                  {config.alerts.unusualSpending.enabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        超過平均值閾值 ({config.alerts.unusualSpending.threshold}%)
                      </label>
                      <input
                        type="range"
                        min="20"
                        max="200"
                        step="10"
                        value={config.alerts.unusualSpending.threshold}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          alerts: { ...prev.alerts, unusualSpending: { ...prev.alerts.unusualSpending, threshold: parseInt(e.target.value) }}
                        }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>20%</span>
                        <span>200%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default DashboardSettings