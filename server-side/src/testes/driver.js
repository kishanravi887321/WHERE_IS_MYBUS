import { io } from "socket.io-client";

const socket = io("http://localhost:5001", {
  transports: ["websocket"]
});

// Step 1: Identify as driver
socket.emit("identify", { type: "driver" });

// Step 2: Join bus as driver
socket.emit("driver:join", {
  busId: "BUS123",
  driverKey: "1234",
  driverInfo: { name: "Rajesh Kumar" }
});

socket.on("driver:joined", (data) => {
  console.log("✅ Driver joined:", data);

  // Step 3: Send location update every 5s
  setInterval(() => {
    socket.emit("driver:location", {
      busId: "BUS123",
      location: { latitude: 28.7041, longitude: 77.1025 }, // Delhi
      speed: 40,
      heading: 90
    });
  }, 1000);
});

socket.on("driver:error", (err) => console.error("❌ Driver error:", err));
socket.on("driver:location:sent", (msg) => console.log("📍 Location sent:", msg));
