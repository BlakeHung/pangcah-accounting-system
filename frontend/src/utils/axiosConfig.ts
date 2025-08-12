import axios from 'axios'

// 設置基礎 URL
axios.defaults.baseURL = 'https://pangcah-accounting-system-production.up.railway.app'

// 請求攔截器 - 添加 token
axios.interceptors.request.use(
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

// 響應攔截器 - 處理 401 錯誤
axios.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // 清除本地存儲
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      
      // 顯示提醒訊息
      const event = new CustomEvent('showSnackbar', { 
        detail: { 
          message: '⏰ 登入已過期，請重新登入', 
          type: 'warning' 
        }
      })
      window.dispatchEvent(event)
      
      // 跳轉到登入頁面
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axios