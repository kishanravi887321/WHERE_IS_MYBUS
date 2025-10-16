"use client"

import { useEffect, useRef, useState } from "react"
import QRCode from "qrcode"
import { Copy, Download, Share, X } from "lucide-react"
import { Button } from "./button"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./dialog"

interface QRCodeProps {
  value: string
  size?: number
  title?: string
  description?: string
  showActions?: boolean
}

export function QRCodeComponent({ 
  value, 
  size = 200, 
  title = "QR Code",
  description,
  showActions = true 
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [qrImageUrl, setQrImageUrl] = useState<string>("")
  const { toast } = useToast()
  const { t } = useLanguage()

  useEffect(() => {
    const generateQR = async () => {
      if (canvasRef.current && value) {
        try {
          setIsLoading(true)
          await QRCode.toCanvas(canvasRef.current, value, {
            width: size,
            margin: 2,
            color: {
              dark: '#212153',  // Primary color
              light: '#FFFFFF', // White background
            },
          })
          // Store the QR image URL for sharing
          setQrImageUrl(canvasRef.current.toDataURL('image/png'))
        } catch (error) {
          console.error('Error generating QR code:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    generateQR()
  }, [value, size])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast({
        title: t('qr.linkCopied'),
        description: t('qr.linkCopiedDesc'),
      })
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('qr.copyFailed'),
        variant: "destructive",
      })
    }
  }

  const downloadQR = () => {
    if (canvasRef.current) {
      const link = document.createElement('a')
      link.download = 'bus-tracking-qr.png'
      link.href = canvasRef.current.toDataURL()
      link.click()
    }
  }

  const shareQR = async () => {
    // Show the share modal with QR image
    setShowShareModal(true)
  }

  const copyQRImage = async () => {
    try {
      // Convert data URL to blob
      const response = await fetch(qrImageUrl)
      const blob = await response.blob()
      
      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ])
        toast({
          title: t('qr.imageCopied'),
          description: t('qr.imageCopiedDesc'),
        })
      } else {
        // Fallback to copying the link
        await copyToClipboard()
      }
    } catch (error) {
      console.error('Error copying QR image:', error)
      toast({
        title: t('common.error'),
        description: t('qr.copyImageFailed'),
        variant: "destructive",
      })
    }
  }

  const downloadQRImage = () => {
    const link = document.createElement('a')
    link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-qr.png`
    link.href = qrImageUrl
    link.click()
    
    toast({
      title: t('qr.downloaded'),
      description: t('qr.downloadedDesc'),
    })
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-4 bg-white rounded-xl border border-gray-200">
      <div className="text-center">
        <h3 className="text-lg font-bold mb-2" style={{color: '#212153'}}>{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        )}
      </div>

      <div className="relative">
        {isLoading && (
          <div 
            className="flex items-center justify-center bg-gray-100 rounded-lg"
            style={{width: size, height: size}}
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{borderColor: '#212153'}}></div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={`rounded-lg shadow-lg ${isLoading ? 'hidden' : 'block'}`}
          style={{width: size, height: size}}
        />
      </div>

      {/* Copyable Link Section */}
      <div className="w-full max-w-md">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1">{t('qr.trackingLink')}</p>
              <p className="text-sm font-mono text-gray-700 truncate">{value}</p>
            </div>
            <Button
              onClick={copyToClipboard}
              size="sm"
              className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2 flex-wrap justify-center">
          <Button
            onClick={copyToClipboard}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
          >
            <Copy className="h-4 w-4" />
            {t('qr.copyLink')}
          </Button>
          
          <Button
            onClick={shareQR}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
          >
            <Share className="h-4 w-4" />
            {t('qr.share')}
          </Button>
        </div>
      )}

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center" style={{color: '#212153'}}>
              {t('qr.shareQRCode')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4 p-4">
            {/* QR Image */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              {qrImageUrl && (
                <img 
                  src={qrImageUrl} 
                  alt="QR Code" 
                  className="w-48 h-48 rounded-lg"
                  style={{imageRendering: 'pixelated'}}
                />
              )}
            </div>

            {/* Title and Description */}
            <div className="text-center">
              <h4 className="font-semibold mb-1" style={{color: '#212153'}}>{title}</h4>
              {description && (
                <p className="text-sm text-gray-600">{description}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full">
              <Button
                onClick={copyQRImage}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Copy className="h-4 w-4 mr-2" />
                {t('qr.copyImage')}
              </Button>
              
              <Button
                onClick={downloadQRImage}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('qr.downloadImage')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}