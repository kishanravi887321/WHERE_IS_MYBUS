// driver.js
import { io } from "socket.io-client";

// Connect to server
const socket = io("ws://localhost:3000");

const busId = "bus_124";

// Tell server this driver is online
socket.emit("driverJoin", busId);

// Send location updates every 3 seconds
setInterval(() => {
  const lat = 25 + Math.random();  // Fake latitude
  const lng = 82 + Math.random();  // Fake longitude

  socket.emit("busLocationUpdate", { busId, lat, lng });
  console.log("📍 Sent location:", lat, lng);
},1000);
