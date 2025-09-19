import { io } from "socket.io-client";

const socket = io("https://where-is-mybus.onrender.com", {
  transports: ["websocket"]
});

// ✅ Wait for socket connection before emitting anything
socket.on("connect", () => {
    console.log("🔌 Connected as driver:", socket.id);

    // Step 1: Identify as driver with the token from your backend response
    socket.emit("identify", { 
        type: "driver", 
        token: "983376", // ← Use the token from your backend response
        busId: "BUS123" 
    });
});

// Listen for identify success
socket.on("identify:success", () => {
    console.log("✅ Identified as driver successfully, now joining bus");

    socket.emit("driver:join", {
        busId: "BUS123",
        driverInfo: { 
            name: "Rajesh Kumar",
            phone: "9876543210"
        }
    });
});

// Listen for identify errors
socket.on("identify:error", (err) => {
    console.error("❌ Identification error:", err);
    socket.disconnect();
});

// Listen for successful join
socket.on("driver:joined", (data) => {
    console.log("✅ Driver joined successfully:", data);

    // Start sending location updates every 5 seconds
    setInterval(() => {
        const locationData = {
            busId: "BUS123",
            location: {
                latitude: 28.7041 + (Math.random() - 0.5) * 0.01, // Add some variation
                longitude: 77.1025 + (Math.random() - 0.5) * 0.01
            },
            speed: 40 + Math.floor(Math.random() * 20), // 40-60 km/h
            heading: 90 + Math.floor(Math.random() * 20 - 10) // 80-100 degrees
        };
        
        console.log("📍 Sending location:", locationData);
        socket.emit("driver:location", locationData);
    }, 5000); // every 5 seconds
});

// Listen for driver join errors
socket.on("driver:error", (err) => {
    console.error("❌ Driver join error:", err);
});

// Listen for location sent confirmation
socket.on("driver:location:sent", (msg) => {
    console.log("📍 Location sent successfully:", msg);
});

// Listen for passenger updates
socket.on("passenger:joined", (data) => {
    console.log("👥 Passenger joined bus:", data);
});

socket.on("passenger:left", (data) => {
    console.log("👋 Passenger left bus:", data);
});

// Handle disconnection
socket.on("disconnect", (reason) => {
    console.log("❌ Disconnected from server:", reason);
});