/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // PAPA 阿美族長光部落文化色彩系統
      colors: {
        papa: {
          // 主要色彩 - 使用 DEFAULT 來定義基本顏色
          stone: {
            DEFAULT: '#543622',     // 石坑土褐 - 導航/標題
            50: '#faf9f8',
            100: '#f3f1ee',
            200: '#e6e1dc',
            300: '#d4cbc1',
            400: '#b8a898',
            500: '#a08970',
            600: '#8b7355',
            700: '#745f47',
            800: '#625042',
            900: '#543622',
            950: '#2d1f15',
          },
          ocean: {
            DEFAULT: '#E91E63',     // PAPA海洋粉紅 - 主要按鈕
            50: '#fef2f4',
            100: '#fce7eb',
            200: '#f9d0dc',
            300: '#f4a8c0',
            400: '#ed7ba0',
            500: '#E91E63',
            600: '#d81b5d',
            700: '#c41f60',
            800: '#a01e5a',
            900: '#881f55',
            950: '#4f0e2d',
          },
          emerald: '#4CAF50',      // 金剛翠綠 - 收入數據
          tide: '#FF7043',         // 潮間帶橙 - 支出數據
          mist: '#ECEFF1',         // 海霧白 - 背景
          betel: '#689F38',        // 檳榔綠 - 次要按鈕
          dawn: '#FF8F00',         // 晨曦金 - accent色
          cave: '#546E7A',         // 岩穴灰 - 分隔線
          
          // 文化輔助色
          tribal: '#6D4C41',       // 達魯岸棕
          wave: '#1976D2',         // 海浪藍
          sunset: '#D32F2F',       // 夕陽紅
        }
      },
      
      // 字體系統
      fontFamily: {
        'display': ['Noto Sans TC', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
      },
      
      // 間距系統
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      
      // 動畫系統
      animation: {
        'papa-sun-pulse': 'papa-sun-pulse 3s ease-in-out infinite',
        'papa-sun-rise': 'papa-sun-rise 2s ease-in-out infinite',
        'papa-ripple': 'papa-ripple 0.6s ease-out',
        'papa-flow': 'papa-flow 2s ease-in-out',
        'papa-tide-in': 'papa-tide-in 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'papa-tide-out': 'papa-tide-out 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'papa-wave-pulse': 'papa-wave-pulse 2s ease-in-out infinite',
        'papa-cultural-float': 'papa-cultural-float 3s ease-in-out infinite',
      },
      
      keyframes: {
        'papa-sun-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.1)' },
        },
        'papa-sun-rise': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'papa-ripple': {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        'papa-flow': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '50%': { opacity: '0.5' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        'papa-tide-in': {
          'from': { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          'to': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'papa-tide-out': {
          'from': { opacity: '1', transform: 'translateY(0) scale(1)' },
          'to': { opacity: '0', transform: 'translateY(-20px) scale(0.95)' },
        },
        'papa-wave-pulse': {
          '0%, 100%': { transform: 'scaleY(1)' },
          '25%': { transform: 'scaleY(1.1)' },
          '50%': { transform: 'scaleY(0.9)' },
          '75%': { transform: 'scaleY(1.05)' },
        },
        'papa-cultural-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        }
      },
      
      // 陰影系統
      boxShadow: {
        'papa-soft': '0 2px 8px rgba(84, 54, 34, 0.08)',
        'papa-medium': '0 4px 16px rgba(84, 54, 34, 0.12)',
        'papa-strong': '0 8px 24px rgba(84, 54, 34, 0.16)',
        'papa-cultural': '0 4px 12px rgba(233, 30, 99, 0.15)',
      },
      
      // 背景圖案
      backgroundImage: {
        'papa-pattern': `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(84, 54, 34, 0.02) 10px,
          rgba(84, 54, 34, 0.02) 20px
        ), repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 10px,
          rgba(233, 30, 99, 0.01) 10px,
          rgba(233, 30, 99, 0.01) 20px
        )`,
        'papa-gradient': 'linear-gradient(135deg, #543622 0%, #6d4c41 100%)',
        'papa-ocean-gradient': 'linear-gradient(135deg, #E91E63 0%, #EC407A 100%)',
        'papa-emerald-gradient': 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
        'papa-dawn-gradient': 'linear-gradient(135deg, #FF8F00 0%, #FFB74D 100%)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}