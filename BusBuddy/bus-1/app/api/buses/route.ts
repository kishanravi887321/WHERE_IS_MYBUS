import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const busData = await request.json()

    console.log("[v0] Received bus registration data:", JSON.stringify(busData, null, 2))

    // Here you would typically save to a database
    // For now, we'll just log the data and return success

    return NextResponse.json(
      {
        success: true,
        message: "Bus registered successfully",
        busId: busData.busId,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Bus registration error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to register bus",
      },
      { status: 500 },
    )
  }
}
