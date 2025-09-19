// Test the bus activation API to see the response format
const testBusActivation = async () => {
  try {
    const response = await fetch("https://where-is-mybus.onrender.com/api/buses/make-active", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        busId: "BUS123", 
        secretKey: "1234" 
      }),
    })

    const data = await response.json()
    console.log("API Response:", JSON.stringify(data, null, 2))
    
    if (response.ok) {
      console.log("✅ Bus activation successful")
      console.log("📝 Token:", data.token)
      console.log("🚌 Bus Info:", data.busInfo)
    } else {
      console.log("❌ Bus activation failed:", data.message)
    }
  } catch (error) {
    console.error("❌ Network error:", error)
  }
}

// Run the test
testBusActivation()