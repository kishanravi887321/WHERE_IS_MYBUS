// user.js
import { io } from "socket.io-client";

// Connect to server
const socket = io("ws://localhost:3000");

const busId = "bus_123";

// Tell server this user wants to track a bus
socket.emit("trackBus", busId);

// Listen for updates
socket.on("locationUpdate", (data) => {
  console.log("🚌 Bus update received:", data);
});
