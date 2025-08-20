import React, { useState, useEffect } from 'react'
import { ReportConfig, ReportTemplate, AvailableField, ReportFilter, ReportMetric } from '../../types/reports'
import ReportConfigStep from './ReportConfigStep'
import ReportPreview from './ReportPreview'
import ReportTemplateSelector from './ReportTemplateSelector'
import { useSnackbar } from '../../contexts/SnackbarContext'

interface CustomReportBuilderProps {
  onSave?: (config: ReportConfig) => void
  onGenerate?: (config: ReportConfig) => void
  initialConfig?: ReportConfig
}

const CustomReportBuilder: React.FC<CustomReportBuilderProps> = ({
  onSave,
  onGenerate,
  initialConfig
}) => {
  const { showSnackbar } = useSnackbar()
  const [currentStep, setCurrentStep] = useState<'template' | 'config' | 'preview'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    id: '',
    name: '',
    description: '',
    type: 'table',
    dateRange: {
      startDate: '',
      endDate: '',
      preset: 'month'
    },
    filters: [],
    groupBy: [],
    metrics: [],
    exportFormats: ['PDF', 'Excel'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  // 可用欄位定義
  const availableFields: AvailableField[] = [
    // 交易相關欄位
    { key: 'date', label: '日期', type: 'date', category: 'transaction', aggregatable: false, filterable: true, sortable: true },
    { key: 'amount', label: '金額', type: 'number', category: 'transaction', aggregatable: true, filterable: true, sortable: true },
    { key: 'type', label: '類型', type: 'string', category: 'transaction', aggregatable: false, filterable: true, sortable: false },
    { key: 'category', label: '分類', type: 'string', category: 'transaction', aggregatable: false, filterable: true, sortable: true },
    { key: 'description', label: '描述', type: 'string', category: 'transaction', aggregatable: false, filterable: true, sortable: false },
    { key: 'location', label: '地點', type: 'string', category: 'transaction', aggregatable: false, filterable: true, sortable: false },
    
    // 用戶相關欄位
    { key: 'userName', label: '用戶名稱', type: 'string', category: 'user', aggregatable: false, filterable: true, sortable: true },
    { key: 'userRole', label: '用戶角色', type: 'string', category: 'user', aggregatable: false, filterable: true, sortable: false },
    
    // 群組相關欄位
    { key: 'groupName', label: '群組名稱', type: 'string', category: 'group', aggregatable: false, filterable: true, sortable: true },
    { key: 'groupType', label: '群組類型', type: 'string', category: 'group', aggregatable: false, filterable: true, sortable: false }
  ]

  // 報表模板
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'monthly-expense-summary',
      name: '月度支出摘要',
      category: 'financial',
      description: '生成月度支出的詳細分析報表，包含分類統計和趨勢分析',
      icon: '📊',
      defaultConfig: {
        type: 'chart',
        dateRange: { preset: 'month' },
        groupBy: ['category'],
        metrics: [
          { field: 'amount', aggregation: 'sum', label: '總支出', format: 'currency' },
          { field: 'amount', aggregation: 'count', label: '交易筆數', format: 'number' }
        ],
        chartConfig: {
          type: 'pie',
          title: '月度支出分類分布',
          xAxis: 'category',
          yAxis: ['amount'],
          showLegend: true,
          showGrid: false
        }
      },
      requiredFields: ['date', 'amount', 'category'],
      isSystem: true
    },
    {
      id: 'user-activity-report',
      name: '用戶活動報表',
      category: 'user_activity',
      description: '分析用戶活動模式和交易行為',
      icon: '👥',
      defaultConfig: {
        type: 'table',
        dateRange: { preset: 'month' },
        groupBy: ['userName'],
        metrics: [
          { field: 'amount', aggregation: 'sum', label: '總交易金額', format: 'currency' },
          { field: 'amount', aggregation: 'count', label: '交易次數', format: 'number' },
          { field: 'amount', aggregation: 'avg', label: '平均交易額', format: 'currency' }
        ]
      },
      requiredFields: ['userName', 'amount'],
      isSystem: true
    },
    {
      id: 'budget-analysis',
      name: '預算執行分析',
      category: 'budget',
      description: '比較預算與實際支出，分析預算執行情況',
      icon: '🎯',
      defaultConfig: {
        type: 'chart',
        dateRange: { preset: 'month' },
        groupBy: ['category'],
        metrics: [
          { field: 'amount', aggregation: 'sum', label: '實際支出', format: 'currency' }
        ],
        chartConfig: {
          type: 'bar',
          title: '預算 vs 實際支出',
          xAxis: 'category',
          yAxis: ['amount'],
          showLegend: true,
          showGrid: true
        }
      },
      requiredFields: ['category', 'amount'],
      isSystem: true
    }
  ]

  useEffect(() => {
    if (initialConfig) {
      setReportConfig(initialConfig)
      setCurrentStep('config')
    }
  }, [initialConfig])

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    setReportConfig(prev => ({
      ...prev,
      ...template.defaultConfig,
      id: `report_${Date.now()}`,
      name: template.name,
      description: template.description
    }))
    setCurrentStep('config')
  }

  const handleConfigChange = (newConfig: Partial<ReportConfig>) => {
    setReportConfig(prev => ({
      ...prev,
      ...newConfig,
      updatedAt: new Date().toISOString()
    }))
  }

  const handlePreview = () => {
    if (!reportConfig.name) {
      showSnackbar('請輸入報表名稱', 'error')
      return
    }
    if (reportConfig.metrics.length === 0) {
      showSnackbar('請至少選擇一個指標', 'error')
      return
    }
    setCurrentStep('preview')
  }

  const handleSave = () => {
    if (onSave) {
      onSave(reportConfig)
      showSnackbar('報表配置已保存', 'success')
    }
  }

  const handleGenerate = () => {
    if (onGenerate) {
      onGenerate(reportConfig)
      showSnackbar('正在生成報表...', 'info')
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'template': return '選擇報表模板'
      case 'config': return '配置報表'
      case 'preview': return '預覽報表'
      default: return '自定義報表生成器'
    }
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg">
      {/* 標題和步驟指示器 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{getStepTitle()}</h1>
            <p className="text-gray-600">建立自定義分析報表</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'template' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="text-sm text-gray-600">模板</span>
            </div>
            <div className="w-6 h-0.5 bg-gray-300" />
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'config' ? 'bg-blue-500 text-white' : 
                ['config', 'preview'].includes(currentStep) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="text-sm text-gray-600">配置</span>
            </div>
            <div className="w-6 h-0.5 bg-gray-300" />
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'preview' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="text-sm text-gray-600">預覽</span>
            </div>
          </div>
        </div>
      </div>

      {/* 步驟內容 */}
      <div className="p-6">
        {currentStep === 'template' && (
          <ReportTemplateSelector
            templates={reportTemplates}
            onSelect={handleTemplateSelect}
            onSkip={() => setCurrentStep('config')}
          />
        )}

        {currentStep === 'config' && (
          <ReportConfigStep
            config={reportConfig}
            availableFields={availableFields}
            onChange={handleConfigChange}
            onBack={() => setCurrentStep('template')}
            onNext={handlePreview}
          />
        )}

        {currentStep === 'preview' && (
          <ReportPreview
            config={reportConfig}
            onBack={() => setCurrentStep('config')}
            onSave={handleSave}
            onGenerate={handleGenerate}
          />
        )}
      </div>
    </div>
  )
}

export default CustomReportBuilder