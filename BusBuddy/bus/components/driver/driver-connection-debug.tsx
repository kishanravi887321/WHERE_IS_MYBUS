"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SocketService } from "@/lib/socket-service"
import { CheckCircle, XCircle, Clock, Zap } from "lucide-react"

interface DriverConnectionDebugProps {
  token: string
  busId: string
}

export function DriverConnectionDebug({ token, busId }: DriverConnectionDebugProps) {
  const [logs, setLogs] = useState<string[]>([])
  const [socketService] = useState(() => SocketService.getInstance())
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "authenticated">("disconnected")

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`])
  }

  useEffect(() => {
    // Listen to socket events for debugging
    const handleConnect = () => {
      addLog("🔌 Socket connected")
      setConnectionStatus("connected")
    }

    const handleIdentifySuccess = () => {
      addLog("✅ Driver identified successfully")
      setConnectionStatus("authenticated")
    }

    const handleIdentifyError = (error: any) => {
      addLog(`❌ Driver identification failed: ${error.message || error}`)
      setConnectionStatus("connected")
    }

    const handleDriverJoined = (data: any) => {
      addLog(`🚌 Driver joined bus: ${JSON.stringify(data)}`)
    }

    const handleDriverError = (error: any) => {
      addLog(`❌ Driver error: ${error.message || error}`)
    }

    const handleLocationSent = (data: any) => {
      addLog(`📍 Location sent: ${data.message || 'Success'}`)
    }

    socketService.on("connect", handleConnect)
    socketService.on("identify:success", handleIdentifySuccess)
    socketService.on("identify:error", handleIdentifyError)
    socketService.on("driver:joined", handleDriverJoined)
    socketService.on("driver:error", handleDriverError)
    socketService.on("driver:location:sent", handleLocationSent)

    return () => {
      socketService.off("connect", handleConnect)
      socketService.off("identify:success", handleIdentifySuccess)
      socketService.off("identify:error", handleIdentifyError)
      socketService.off("driver:joined", handleDriverJoined)
      socketService.off("driver:error", handleDriverError)
      socketService.off("driver:location:sent", handleLocationSent)
    }
  }, [socketService])

  const testConnection = async () => {
    setConnectionStatus("connecting")
    addLog(`🔄 Testing connection with token: ${token}, busId: ${busId}`)
    
    try {
      await socketService.connectAsDriver(token, busId)
      addLog("✅ Driver connection successful")
    } catch (error: any) {
      addLog(`❌ Driver connection failed: ${error.message || error}`)
      setConnectionStatus("disconnected")
    }
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "disconnected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Disconnected</Badge>
      case "connecting":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Connecting</Badge>
      case "connected":
        return <Badge variant="outline"><Zap className="w-3 h-3 mr-1" />Connected</Badge>
      case "authenticated":
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Authenticated</Badge>
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-4 bg-blue-50 border-blue-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between" style={{color: '#212153'}}>
          Connection Debug
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-700"><strong>Token:</strong> {token}</p>
          <p className="text-sm text-gray-700"><strong>Bus ID:</strong> {busId}</p>
        </div>

        <Button 
          onClick={testConnection} 
          className="w-full text-white"
          style={{backgroundColor: '#212153'}}
          disabled={connectionStatus === "connecting"}
        >
          {connectionStatus === "connecting" ? "Connecting..." : "Test Connection"}
        </Button>

        <div className="max-h-40 overflow-y-auto bg-white border border-blue-100 p-3 rounded text-xs font-mono">
          <strong style={{color: '#212153'}}>Connection Logs:</strong>
          {logs.length === 0 ? (
            <p className="text-gray-500 mt-2">No logs yet. Click "Test Connection" to start.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mt-1 text-gray-700">
                {log}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
