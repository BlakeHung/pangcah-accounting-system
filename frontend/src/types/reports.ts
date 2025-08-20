// 報表配置類型
export interface ReportConfig {
  id: string
  name: string
  description?: string
  type: 'table' | 'chart' | 'summary'
  dateRange: {
    startDate: string
    endDate: string
    preset?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
  }
  filters: ReportFilter[]
  groupBy: string[]
  metrics: ReportMetric[]
  chartConfig?: ChartConfig
  exportFormats: ('PDF' | 'Excel' | 'CSV' | 'PNG' | 'JSON')[]
  schedule?: ReportSchedule
  createdAt: string
  updatedAt: string
}

// 報表篩選器
export interface ReportFilter {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in'
  value: any
  values?: any[]
  label: string
}

// 報表指標
export interface ReportMetric {
  field: string
  aggregation: 'sum' | 'count' | 'avg' | 'min' | 'max' | 'distinct_count'
  label: string
  format?: 'currency' | 'percentage' | 'number' | 'date'
}

// 圖表配置
export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap'
  title: string
  xAxis: string
  yAxis: string[]
  colors?: string[]
  showLegend: boolean
  showGrid: boolean
}

// 報表排程
export interface ReportSchedule {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string // HH:MM format
  weekday?: number // 0-6 (Sunday-Saturday)
  dayOfMonth?: number // 1-31
  recipients: string[]
}

// 報表結果
export interface ReportResult {
  config: ReportConfig
  data: any[]
  summary: ReportSummary
  generatedAt: string
  rowCount: number
  executionTime: number
}

// 報表摘要
export interface ReportSummary {
  totalRecords: number
  aggregations: { [metric: string]: any }
  dateRange: {
    actualStart: string
    actualEnd: string
  }
}

// 預設報表模板
export interface ReportTemplate {
  id: string
  name: string
  category: 'financial' | 'user_activity' | 'budget' | 'custom'
  description: string
  icon: string
  defaultConfig: Partial<ReportConfig>
  requiredFields: string[]
  isSystem: boolean
}

// 可用欄位定義
export interface AvailableField {
  key: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean'
  category: 'transaction' | 'user' | 'category' | 'group'
  aggregatable: boolean
  filterable: boolean
  sortable: boolean
}

// 報表生成請求
export interface ReportGenerationRequest {
  config: ReportConfig
  format: 'JSON' | 'PDF' | 'Excel' | 'CSV'
  options?: {
    includeCharts?: boolean
    pageSize?: 'A4' | 'A3' | 'Letter'
    orientation?: 'portrait' | 'landscape'
  }
}