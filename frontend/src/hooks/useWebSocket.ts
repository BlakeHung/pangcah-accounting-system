import { useEffect, useState, useRef, useCallback } from 'react'
import { useSnackbar } from '../contexts/SnackbarContext'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

interface WebSocketHookOptions {
  url: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

interface WebSocketHookReturn {
  socket: WebSocket | null
  isConnected: boolean
  lastMessage: WebSocketMessage | null
  sendMessage: (type: string, data: any) => void
  subscribe: (eventType: string, handler: (data: any) => void) => () => void
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
}

export const useWebSocket = (options: WebSocketHookOptions): WebSocketHookReturn => {
  const { url, reconnectInterval = 3000, maxReconnectAttempts = 5 } = options
  const { showSnackbar } = useSnackbar()
  
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('disconnected')
  
  const reconnectAttempts = useRef(0)
  const reconnectTimeout = useRef<NodeJS.Timeout>()
  const eventHandlers = useRef<Map<string, ((data: any) => void)[]>>(new Map())

  const connect = useCallback(() => {
    if (socket?.readyState === WebSocket.OPEN) return

    setConnectionStatus('connecting')
    
    try {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        console.log('✅ WebSocket 連接成功')
        setIsConnected(true)
        setConnectionStatus('connected')
        reconnectAttempts.current = 0
        options.onConnect?.()
        showSnackbar('即時連接已建立', 'success')
      }

      ws.onclose = (event) => {
        console.log('🔌 WebSocket 連接關閉:', event.code, event.reason)
        setIsConnected(false)
        setSocket(null)
        options.onDisconnect?.()

        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          setConnectionStatus('reconnecting')
          reconnectAttempts.current++
          showSnackbar(`連接中斷，正在重試 (${reconnectAttempts.current}/${maxReconnectAttempts})`, 'warning')
          
          reconnectTimeout.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        } else {
          setConnectionStatus('disconnected')
          if (reconnectAttempts.current >= maxReconnectAttempts) {
            showSnackbar('無法建立即時連接，請檢查網路狀態', 'error')
          }
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket 錯誤:', error)
        options.onError?.(error)
        setConnectionStatus('disconnected')
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)
          
          // 觸發事件處理器
          const handlers = eventHandlers.current.get(message.type) || []
          handlers.forEach(handler => handler(message.data))
          
        } catch (error) {
          console.error('解析 WebSocket 訊息失敗:', error)
        }
      }

      setSocket(ws)
    } catch (error) {
      console.error('建立 WebSocket 連接失敗:', error)
      setConnectionStatus('disconnected')
    }
  }, [url, reconnectInterval, maxReconnectAttempts, options, showSnackbar])

  const sendMessage = useCallback((type: string, data: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data,
        timestamp: new Date().toISOString()
      }
      socket.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket 未連接，無法發送訊息')
      showSnackbar('連接中斷，無法發送資料', 'error')
    }
  }, [socket, showSnackbar])

  const subscribe = useCallback((eventType: string, handler: (data: any) => void) => {
    const handlers = eventHandlers.current.get(eventType) || []
    handlers.push(handler)
    eventHandlers.current.set(eventType, handlers)

    // 返回取消訂閱函數
    return () => {
      const currentHandlers = eventHandlers.current.get(eventType) || []
      const filteredHandlers = currentHandlers.filter(h => h !== handler)
      if (filteredHandlers.length === 0) {
        eventHandlers.current.delete(eventType)
      } else {
        eventHandlers.current.set(eventType, filteredHandlers)
      }
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
      if (socket) {
        socket.close(1000, 'Component unmounting')
      }
    }
  }, [connect])

  return {
    socket,
    isConnected,
    lastMessage,
    sendMessage,
    subscribe,
    connectionStatus
  }
}

// 預設的即時資料 Hook
export const useRealtimeData = () => {
  const wsOptions: WebSocketHookOptions = {
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws',
    reconnectInterval: 3000,
    maxReconnectAttempts: 5
  }

  return useWebSocket(wsOptions)
}