"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, ArrowRight, X } from "lucide-react"

interface RecentSearch {
  id: string
  fromStop: string
  toStop: string
  timestamp: number
}

interface RecentSearchesProps {
  onSearchSelect: (fromStop: string, toStop: string) => void
}

export function RecentSearches({ onSearchSelect }: RecentSearchesProps) {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem("busbuddy-recent-searches")
    if (saved) {
      try {
        const searches = JSON.parse(saved)
        setRecentSearches(searches.slice(0, 5)) // Keep only last 5 searches
      } catch (error) {
        console.error("Error loading recent searches:", error)
      }
    }
  }, [])

  const addRecentSearch = (fromStop: string, toStop: string) => {
    const newSearch: RecentSearch = {
      id: Date.now().toString(),
      fromStop,
      toStop,
      timestamp: Date.now(),
    }

    const updatedSearches = [
      newSearch,
      ...recentSearches.filter((search) => !(search.fromStop === fromStop && search.toStop === toStop)),
    ].slice(0, 5)

    setRecentSearches(updatedSearches)
    localStorage.setItem("busbuddy-recent-searches", JSON.stringify(updatedSearches))
  }

  const removeRecentSearch = (id: string) => {
    const updatedSearches = recentSearches.filter((search) => search.id !== id)
    setRecentSearches(updatedSearches)
    localStorage.setItem("busbuddy-recent-searches", JSON.stringify(updatedSearches))
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ago`
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`
    } else {
      return "Just now"
    }
  }

  // Expose addRecentSearch function to parent component
  useEffect(() => {
    ;(window as any).addRecentSearch = addRecentSearch
  }, [recentSearches])

  if (recentSearches.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" />
          Recent Searches
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recentSearches.map((search) => (
          <div
            key={search.id}
            className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            <div className="flex-1 cursor-pointer" onClick={() => onSearchSelect(search.fromStop, search.toStop)}>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{search.fromStop}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{search.toStop}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{formatTimestamp(search.timestamp)}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeRecentSearch(search.id)} className="h-8 w-8 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
