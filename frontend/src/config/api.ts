import axios from 'axios'

// API Base URL 配置
const getApiBaseUrl = () => {
  // 如果有環境變數，使用環境變數
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // 根據環境自動判斷
  if (import.meta.env.DEV) {
    // 開發模式：透過 Vite proxy 使用 /api 路徑
    return ''
  } else {
    // 生產模式：使用 Railway API
    return 'https://pangcah-accounting-system-production.up.railway.app'
  }
}

// 創建 axios 實例
export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 請求攔截器：自動添加認證 token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 響應攔截器：處理認證錯誤
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // 如果是 401 錯誤且沒有重試過
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${getApiBaseUrl()}/api/v1/auth/refresh/`, {
            refresh: refreshToken,
          })
          
          const newToken = response.data.access
          localStorage.setItem('access_token', newToken)
          
          // 重試原請求
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Refresh token 也過期，清除所有 token 並導向登入頁
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// API 端點常數
export const API_ENDPOINTS = {
  // 認證相關
  LOGIN: '/api/v1/auth/login/',
  TOKEN_REFRESH: '/api/v1/auth/refresh/',
  
  // 用戶管理
  USERS: '/api/v1/auth/users/',
  USER_ME: '/api/v1/auth/users/me/',
  USER_PREFERENCES: '/api/v1/auth/users/me/preferences/',
  
  // 群組管理
  GROUPS: '/api/v1/groups/',
  
  // 活動管理
  EVENTS: '/api/v1/events/',
  
  // 支出管理
  EXPENSES: '/api/v1/expenses/',
  
  // 分類管理
  CATEGORIES: '/api/v1/categories/',
} as const

export default apiClient