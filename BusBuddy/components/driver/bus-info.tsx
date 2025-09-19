"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bus, Route, User, Phone } from "lucide-react"

interface BusInfoProps {
  busId: string
  busNumber?: string
  routeName?: string
  driverName: string
  driverPhone?: string
}

export function BusInfo({ busId, busNumber, routeName, driverName, driverPhone }: BusInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bus className="h-5 w-5 text-accent" />
          Bus Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Bus ID</div>
            <div className="font-medium">{busId}</div>
          </div>
          {busNumber && (
            <div>
              <div className="text-sm text-muted-foreground">Bus Number</div>
              <Badge variant="outline" className="font-medium">
                {busNumber}
              </Badge>
            </div>
          )}
        </div>

        {routeName && (
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Route className="h-3 w-3" />
              Route
            </div>
            <div className="font-medium">{routeName}</div>
          </div>
        )}

        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <User className="h-3 w-3" />
            Driver Details
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="font-medium">{driverName}</div>
            </div>
            {driverPhone && (
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="font-medium flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {driverPhone}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
