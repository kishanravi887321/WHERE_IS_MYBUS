"use client"

import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Languages } from "lucide-react"

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="flex items-center space-x-2">
      <Languages className="h-4 w-4 text-gray-600" />
      <Select value={language} onValueChange={(value: 'en' | 'hi') => setLanguage(value)}>
        <SelectTrigger className="w-32 h-8 text-sm border-gray-300 bg-white text-gray-900">
          <SelectValue className="text-gray-900" />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-300 shadow-lg">
          <SelectItem value="en" className="text-gray-900 hover:bg-gray-100">{t('language.english')}</SelectItem>
          <SelectItem value="hi" className="text-gray-900 hover:bg-gray-100">{t('language.hindi')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}