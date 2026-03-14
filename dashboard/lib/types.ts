export interface WahaSession {
  name: string
  status: 'STARTING' | 'SCAN_QR_CODE' | 'WORKING' | 'FAILED' | 'STOPPED'
  me?: { id: string; pushName: string }
}

export interface WahaMessage {
  id: string
  session: string
  from: string
  senderName: string
  body: string
  type: string
  hasMedia: boolean
  timestamp: number
  fromMe: boolean
}

export interface BridgeStatus {
  status: 'ok' | 'error'
  uptime: number
  timestamp: string
}

export interface DashboardStats {
  messagesReceived: number
  alertsSent: number
  alertsFailed: number
  sessionsActive: number
}

export interface LogEntry {
  id: string
  level: 'info' | 'warn' | 'error'
  time: string
  message: string
  meta?: Record<string, unknown>
}
