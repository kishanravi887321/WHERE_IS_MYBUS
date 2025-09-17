import { io } from "socket.io-client";

const socket = io("http://localhost:5001", {
  transports: ["websocket"]
});

// Step 1: Identify as passenger
socket.emit("identify", { type: "passenger" });

// Step 2: Join the same bus room
socket.emit("passenger:join", { busId: "BUS123" });

// Step 3: Listen for location updates
socket.on("bus:location", (data) => {
  console.log("🚌 Bus location update:", data);
});

socket.on("driver:online", (data) => console.log("✅ Driver online:", data));
socket.on("error", (err) => console.error("❌ Passenger error:", err));
