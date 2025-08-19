// ECharts 基礎配置
export const baseChartConfig = {
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 12
  },
  // 阿美族家族記帳系統配色方案
  color: [
    '#4F46E5', // 主藍色
    '#10B981', // 綠色（收入）
    '#F59E0B', // 橙色（支出）
    '#EF4444', // 紅色（超支）
    '#8B5CF6', // 紫色
    '#06B6D4', // 青色
    '#84CC16', // 萊姆綠
    '#F97316'  // 深橙色
  ],
  animation: true,
  animationDuration: 1000,
  animationEasing: 'cubicInOut'
};

// 通用 Grid 配置
export const defaultGrid = {
  left: '3%',
  right: '4%',
  bottom: '3%',
  containLabel: true
};

// 通用 Tooltip 配置
export const defaultTooltip = {
  trigger: 'axis' as const,
  backgroundColor: 'rgba(50, 50, 50, 0.9)',
  borderColor: '#333',
  borderWidth: 1,
  textStyle: {
    color: '#fff',
    fontSize: 12
  },
  axisPointer: {
    type: 'shadow' as const
  }
};

// 通用 Legend 配置
export const defaultLegend = {
  top: 10,
  left: 'center',
  textStyle: {
    fontSize: 12,
    color: '#666'
  }
};

// 工具箱配置
export const defaultToolbox = {
  feature: {
    dataZoom: {
      yAxisIndex: 'none'
    },
    restore: {},
    saveAsImage: {
      name: '阿美族家族記帳系統圖表'
    }
  },
  right: 10,
  top: 10
};

// 數據縮放配置
export const defaultDataZoom = [
  {
    type: 'inside' as const,
    start: 0,
    end: 100
  },
  {
    type: 'slider' as const,
    start: 0,
    end: 100,
    height: 20,
    bottom: 10
  }
];