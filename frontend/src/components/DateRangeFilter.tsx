import React from 'react'

export interface DateRange {
  startDate: string
  endDate: string
  label: string
}

interface DateRangeFilterProps {
  selectedRange: string
  onRangeChange: (range: string) => void
  customStartDate?: string
  customEndDate?: string
  onCustomDateChange?: (start: string, end: string) => void
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  selectedRange,
  onRangeChange,
  customStartDate,
  customEndDate,
  onCustomDateChange
}) => {
  // 預設時間範圍選項
  const presetRanges = [
    { value: 'today', label: '今日', icon: '☀️' },
    { value: 'week', label: '本週', icon: '📅' },
    { value: 'month', label: '本月', icon: '🗓️' },
    { value: 'quarter', label: '本季', icon: '📊' },
    { value: 'year', label: '今年', icon: '🎯' },
    { value: 'last_month', label: '上個月', icon: '⏮️' },
    { value: 'last_year', label: '去年', icon: '📆' },
    { value: 'custom', label: '自訂', icon: '⚙️' }
  ]

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-medium text-gray-700 mb-3">時間範圍篩選</h3>
      
      {/* 預設範圍按鈕 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {presetRanges.map(range => (
          <button
            key={range.value}
            onClick={() => onRangeChange(range.value)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
              selectedRange === range.value
                ? 'bg-[#2E8B57] text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{range.icon}</span>
            <span>{range.label}</span>
          </button>
        ))}
      </div>

      {/* 自訂日期選擇器 */}
      {selectedRange === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              開始日期
            </label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => onCustomDateChange?.(e.target.value, customEndDate || '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E8B57] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              結束日期
            </label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => onCustomDateChange?.(customStartDate || '', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E8B57] focus:border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// 計算日期範圍的輔助函數
export const calculateDateRange = (rangeType: string): DateRange => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const date = today.getDate()
  const day = today.getDay()

  let startDate: Date
  let endDate: Date = new Date(today)
  let label: string

  switch (rangeType) {
    case 'today':
      startDate = new Date(today)
      label = '今日'
      break
    
    case 'week':
      // 本週（週一到週日）
      const monday = date - day + (day === 0 ? -6 : 1)
      startDate = new Date(year, month, monday)
      endDate = new Date(year, month, monday + 6)
      label = '本週'
      break
    
    case 'month':
      startDate = new Date(year, month, 1)
      endDate = new Date(year, month + 1, 0)
      label = `${year}年${month + 1}月`
      break
    
    case 'quarter':
      const quarter = Math.floor(month / 3)
      startDate = new Date(year, quarter * 3, 1)
      endDate = new Date(year, quarter * 3 + 3, 0)
      label = `${year}年第${quarter + 1}季`
      break
    
    case 'year':
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31)
      label = `${year}年`
      break
    
    case 'last_month':
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0)
      label = `${year}年${month}月`
      break
    
    case 'last_year':
      startDate = new Date(year - 1, 0, 1)
      endDate = new Date(year - 1, 11, 31)
      label = `${year - 1}年`
      break
    
    default:
      startDate = new Date(year, month, 1)
      endDate = new Date(year, month + 1, 0)
      label = '自訂範圍'
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    label
  }
}

export default DateRangeFilter