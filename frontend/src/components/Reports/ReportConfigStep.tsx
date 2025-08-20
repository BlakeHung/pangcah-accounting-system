import React from 'react'
import { ReportConfig, AvailableField } from '../../types/reports'

interface ReportConfigStepProps {
  config: ReportConfig
  availableFields: AvailableField[]
  onChange: (config: Partial<ReportConfig>) => void
  onBack: () => void
  onNext: () => void
}

const ReportConfigStep: React.FC<ReportConfigStepProps> = ({
  config,
  availableFields,
  onChange,
  onBack,
  onNext
}) => {
  const handleBasicInfoChange = (field: keyof ReportConfig, value: any) => {
    onChange({ [field]: value })
  }

  const handleDateRangeChange = (field: string, value: any) => {
    onChange({
      dateRange: {
        ...config.dateRange,
        [field]: value
      }
    })
  }

  const handleMetricAdd = () => {
    const newMetric = {
      field: 'amount',
      aggregation: 'sum' as const,
      label: '總金額',
      format: 'currency' as const
    }
    onChange({
      metrics: [...config.metrics, newMetric]
    })
  }

  return (
    <div className="space-y-8">
      {/* 基本資訊 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">基本資訊</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              報表名稱 *
            </label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => handleBasicInfoChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="輸入報表名稱"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              報表類型
            </label>
            <select
              value={config.type}
              onChange={(e) => handleBasicInfoChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="table">表格</option>
              <option value="chart">圖表</option>
              <option value="summary">摘要</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            描述
          </label>
          <textarea
            value={config.description || ''}
            onChange={(e) => handleBasicInfoChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="輸入報表描述（可選）"
          />
        </div>
      </div>

      {/* 時間範圍 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">時間範圍</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              預設範圍
            </label>
            <select
              value={config.dateRange.preset || 'custom'}
              onChange={(e) => handleDateRangeChange('preset', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">今天</option>
              <option value="week">本週</option>
              <option value="month">本月</option>
              <option value="quarter">本季</option>
              <option value="year">本年</option>
              <option value="custom">自定義</option>
            </select>
          </div>
          {config.dateRange.preset === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開始日期
                </label>
                <input
                  type="date"
                  value={config.dateRange.startDate}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  結束日期
                </label>
                <input
                  type="date"
                  value={config.dateRange.endDate}
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 指標配置 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">指標配置</h3>
          <button
            onClick={handleMetricAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            + 新增指標
          </button>
        </div>
        
        {config.metrics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-3">📊</div>
            <p>尚未設定任何指標</p>
            <p className="text-sm">點擊上方按鈕開始新增</p>
          </div>
        ) : (
          <div className="space-y-3">
            {config.metrics.map((metric, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      欄位
                    </label>
                    <select
                      value={metric.field}
                      onChange={(e) => {
                        const newMetrics = [...config.metrics]
                        newMetrics[index] = { ...metric, field: e.target.value }
                        onChange({ metrics: newMetrics })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      {availableFields.filter(f => f.aggregatable).map(field => (
                        <option key={field.key} value={field.key}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      聚合方式
                    </label>
                    <select
                      value={metric.aggregation}
                      onChange={(e) => {
                        const newMetrics = [...config.metrics]
                        newMetrics[index] = { ...metric, aggregation: e.target.value as any }
                        onChange({ metrics: newMetrics })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="sum">加總</option>
                      <option value="count">計數</option>
                      <option value="avg">平均</option>
                      <option value="min">最小值</option>
                      <option value="max">最大值</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      標籤
                    </label>
                    <input
                      type="text"
                      value={metric.label}
                      onChange={(e) => {
                        const newMetrics = [...config.metrics]
                        newMetrics[index] = { ...metric, label: e.target.value }
                        onChange({ metrics: newMetrics })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        const newMetrics = config.metrics.filter((_, i) => i !== index)
                        onChange({ metrics: newMetrics })
                      }}
                      className="text-red-600 hover:text-red-700 px-3 py-2 text-sm"
                    >
                      移除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 操作按鈕 */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-medium"
        >
          ← 返回
        </button>
        <button
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          預覽報表 →
        </button>
      </div>
    </div>
  )
}

export default ReportConfigStep