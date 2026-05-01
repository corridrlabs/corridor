import { useEffect, useCallback, useRef } from 'react'
import { WS_URL } from '../config/env'

interface WebhookEvent {
  type: string
  data: any
  timestamp: string
}

type EventHandler = (event: WebhookEvent) => void

export const useWebhook = () => {
  const eventHandlers = useRef<Map<string, EventHandler[]>>(new Map())
  const wsRef = useRef<WebSocket | null>(null)

  const connect = useCallback(() => {
    const token = localStorage.getItem('token')
    
    if (!token) return

    wsRef.current = new WebSocket(`${WS_URL}?token=${token}`)
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connected')
    }
    
    wsRef.current.onmessage = (event) => {
      try {
        const webhookEvent: WebhookEvent = JSON.parse(event.data)
        const handlers = eventHandlers.current.get(webhookEvent.type) || []
        handlers.forEach(handler => handler(webhookEvent))
      } catch (error) {
        console.error('Failed to parse webhook event:', error)
      }
    }
    
    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected')
      // Reconnect after 5 seconds
      setTimeout(connect, 5000)
    }
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }, [])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const subscribe = useCallback((eventType: string, handler: EventHandler) => {
    const handlers = eventHandlers.current.get(eventType) || []
    handlers.push(handler)
    eventHandlers.current.set(eventType, handlers)

    // Return unsubscribe function
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
    return disconnect
  }, [connect, disconnect])

  return {
    subscribe,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  }
}
