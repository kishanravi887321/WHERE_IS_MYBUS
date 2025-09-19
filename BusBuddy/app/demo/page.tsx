import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bus, Smartphone, MapPin, Clock } from "lucide-react"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">BusBuddy Demo</h1>
          <p className="text-muted-foreground">Experience real-time bus tracking</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus className="h-5 w-5" />
                Real-time Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Track buses in real-time with live location updates and estimated arrival times.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Mobile Optimized
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Responsive design that works perfectly on all devices and screen sizes.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Route Planning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Find the best routes and stops for your journey with interactive maps.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Live Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Get real-time notifications about delays, route changes, and arrivals.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            This is a demo page showcasing BusBuddy features
          </p>
        </div>
      </div>
    </div>
  )
}
