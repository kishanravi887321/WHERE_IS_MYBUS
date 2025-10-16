"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { MessageCircle, X, Mic, MicOff, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import { AuthService } from "@/lib/auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { toast } = useToast()
  const { t } = useLanguage()
  const router = useRouter()

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initialize chatbot with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: t('chatbot.welcome'),
        isUser: false,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, messages.length, t])

  const addMessage = (text: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }



  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        processAudio()
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: t('common.error'),
        description: t('chatbot.microphoneError'),
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processAudio = async () => {
    if (audioChunksRef.current.length === 0) return

    setIsTranscribing(true)
    addMessage(t('chatbot.transcribing'), true)

    try {
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
      })

      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")

      const authService = AuthService.getInstance()
      const accessToken = authService.getAccessToken()

      const response = await fetch(`${API_BASE_URL}/api/chatbot/transcribe`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      
      console.log(data);
      // Remove the "transcribing" message
      setMessages(prev => prev.slice(0, -1))
      
      if (data.success && data.data) {
        const { transcription, destinations, processing, busSearch } = data.data
        
        // Add the transcribed text as user message
        if (transcription?.text) {
          addMessage(`🎤 "${transcription.text}"`, true)
        }
        
        // Add AI response based on route extraction and bus search results
        if (destinations?.isValidRoute) {
          const routeMessage = `🗺️ ${t('chatbot.routeFound')}: ${destinations.source} → ${destinations.destination}`
          addMessage(routeMessage, false)
          
          // Handle bus search results
          if (busSearch) {
            if (busSearch.count === 0) {
              // No buses available
              const noBusMessage = `❌ ${t('chatbot.noBusesAvailable')}\n\n${t('chatbot.tryDifferentRoute')}`
              addMessage(noBusMessage, false)
            } else {
              // Redirect to search results page with bus data
              const busesFoundMessage = `🚌 ${t('chatbot.busesFound').replace('{count}', busSearch.count.toString())} ${busSearch.count === 1 ? t('chatbot.bus') : t('chatbot.buses')}\n\n🔄 ${t('chatbot.redirectingToResults')}`
              addMessage(busesFoundMessage, false)
              
              // Close chatbot and redirect after a short delay
              setTimeout(() => {
                setIsOpen(false)
                
                // Prepare URL parameters
                const params = new URLSearchParams()
                if (destinations.source) params.set('source', destinations.source)
                if (destinations.destination) params.set('destination', destinations.destination)
                if (busSearch.results) params.set('buses', encodeURIComponent(JSON.stringify(busSearch.results)))
                
                // Navigate to search results page
                router.push(`/passenger/search-results?${params.toString()}`)
              }, 1500)
            }
          } else {
            // Fallback if no busSearch data
            const searchingMessage = t('chatbot.searchingBuses')
            addMessage(searchingMessage, false)
          }
        } else {
          // Route not clear, ask for clarification
          const clarificationMessage = `${t('chatbot.routeUnclear')}\n\n${t('chatbot.pleaseSpecify')}`
          addMessage(clarificationMessage, false)
        }
        
        // Show additional info if available
        if (transcription?.language && transcription.language !== 'en') {
          const languageInfo = `📍 ${t('chatbot.detectedLanguage')}: ${transcription.language}`
          addMessage(languageInfo, false)
        }
      } else {
        addMessage(data.message || t('chatbot.transcriptionError'), false)
      }
    } catch (error) {
      console.error("Error processing audio:", error)
      // Remove the "transcribing" message
      setMessages(prev => prev.slice(0, -1))
      addMessage(t('chatbot.transcriptionError'), false)
      toast({
        title: t('common.error'),
        description: t('chatbot.audioError'),
        variant: "destructive",
      })
    } finally {
      setIsTranscribing(false)
    }
  }

  // Don't render anything until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  return (
    <>
      {/* Enhanced Fixed Chatbot Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 group">
          <div className="relative">
            {/* Pulsing background effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-ping opacity-30"></div>
            
            <Button
              onClick={() => setIsOpen(true)}
              className="relative rounded-full w-16 h-16 shadow-2xl hover:shadow-3xl transition-all duration-500 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 hover:scale-110 border-2 border-white/20"
            >
              <MessageCircle className="h-7 w-7 text-white animate-pulse" />
            </Button>
            
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                {t('chatbot.title')}
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Chatbot Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[520px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] animate-in slide-in-from-bottom-4 slide-in-from-right-4 duration-300">
          <Card className="h-full flex flex-col shadow-2xl border-0 bg-white/98 backdrop-blur-xl rounded-3xl overflow-hidden">
            {/* Enhanced Header */}
            <CardHeader 
              className="flex-shrink-0 pb-4 pt-4 relative overflow-hidden"
              style={{background: 'linear-gradient(135deg, #212153 0%, #1e1b4b 50%, #6366f1 100%)'}}
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
              </div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 p-2 shadow-lg">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg font-bold">
                      {t('chatbot.title')}
                    </CardTitle>
                    <p className="text-white/80 text-xs">
                      {isRecording ? '🎤 Listening...' : 
                       isTranscribing ? '⚡ Processing...' : 
                       '✨ Ready to help'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0 transition-all duration-200 hover:scale-110"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-5 min-h-0 bg-gradient-to-b from-slate-50/50 to-white">
              {/* Enhanced Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`flex items-start space-x-2 max-w-[85%] ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
                        message.isUser 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                          : 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-white'
                      }`}>
                        {message.isUser ? 'You' : 'AI'}
                      </div>
                      
                      {/* Message bubble */}
                      <div className={`relative group ${message.isUser ? 'ml-2' : 'mr-2'}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm shadow-sm transition-all duration-200 group-hover:shadow-md ${
                            message.isUser
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-md'
                              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md hover:border-gray-300'
                          }`}
                        >
                          {/* Format message text with better line breaks and styling */}
                          <div className="whitespace-pre-wrap leading-relaxed">
                            {message.text.split('\n').map((line, i) => (
                              <div key={i} className={line.startsWith('🚍') || line.startsWith('🗺️') || line.startsWith('🚌') ? 'font-semibold' : ''}>
                                {line}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Message tail */}
                        <div className={`absolute top-4 w-0 h-0 ${
                          message.isUser 
                            ? 'right-0 border-l-8 border-l-purple-600 border-t-4 border-b-4 border-t-transparent border-b-transparent' 
                            : 'left-0 border-r-8 border-r-white border-t-4 border-b-4 border-t-transparent border-b-transparent'
                        }`}></div>
                        
                        {/* Timestamp on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-gray-500 mt-1 text-center">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Enhanced Audio Input Area */}
              <div className="flex-shrink-0 space-y-4 bg-gradient-to-t from-gray-50 to-transparent rounded-t-2xl pt-4 px-2">
                {/* Status indicator */}
                <div className="text-center">
                  <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isRecording 
                      ? 'bg-red-100 text-red-700 border border-red-200' 
                      : isTranscribing 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'bg-green-100 text-green-700 border border-green-200'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      isRecording 
                        ? 'bg-red-500 animate-pulse' 
                        : isTranscribing 
                        ? 'bg-blue-500 animate-pulse' 
                        : 'bg-green-500'
                    }`}></div>
                    <span>
                      {isRecording ? t('chatbot.recording') : 
                       isTranscribing ? t('chatbot.processing') : 
                       t('chatbot.tapToSpeak')}
                    </span>
                  </div>
                </div>

                {/* Enhanced microphone button */}
                <div className="flex justify-center relative">
                  {/* Animated ring effects */}
                  {isRecording && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20"></div>
                      <div className="absolute inset-2 rounded-full bg-red-400 animate-ping opacity-30 animation-delay-200"></div>
                    </>
                  )}
                  
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribing}
                    className={`relative rounded-full w-20 h-20 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 border-4 border-white/30 ${
                      isRecording 
                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 animate-pulse' 
                        : isTranscribing
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                        : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700'
                    }`}
                  >
                    {isTranscribing ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="h-8 w-8 animate-pulse" />
                    ) : (
                      <Mic className="h-8 w-8" />
                    )}
                  </Button>
                </div>
                
                {/* Processing animation */}
                {(isRecording || isTranscribing) && (
                  <div className="text-center animate-in fade-in duration-300">
                    <div className="inline-flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                        <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {isRecording ? 'Listening to your voice...' : 'Processing audio...'}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Quick tips */}
                {!isRecording && !isTranscribing && messages.length <= 1 && (
                  <div className="text-center animate-in fade-in duration-500 delay-1000">
                    <p className="text-xs text-gray-500 px-4">
                      💡 Try saying: "I want to go from Central Station to Airport"
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}