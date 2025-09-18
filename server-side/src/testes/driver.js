import { io } from "socket.io-client";

// const socket = io("https://where-is-mybus.onrender.com" , {
//   transports: ["websocket"]
// });
const socket = io("http://localhost:5001", {
  transports: ["websocket"]
});

// Step 1: Identify as driver
socket.emit("identify", { type: "driver", token: "332740", busId: "BUS123" });
socket.on("identify:error", (err) => {
  console.error("❌ Identification error:", err);
  socket.disconnect();
});

// Step 2: Join bus as driver
socket.emit("driver:join", {
  busId: "BUS123",
  // driverKey: "1234",  // simple auth for demo
  driverInfo: { name: "Rajesh Kumar" }
});

socket.on("driver:joined", (data) => {
  console.log("✅ Driver joined:", data);

 setInterval(() => {
  socket.emit("driver:location", {
    busId: "BUS123",
    location: {   // ✅ Match what server expects
      latitude: 28.7041,
      longitude: 77.1025
    },
    speed: 40,
    heading: 90
  });
}, 5000); // every 5 sec
});

socket.on("driver:error", (err) => console.error("❌ Driver error:", err));
socket.on("driver:location:sent", (msg) => console.log("📍 Location sent:", msg));
