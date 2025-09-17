// server.js
import { Server } from "socket.io";

const io = new Server(3000, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);

  // Driver joins its bus room
  socket.on("driverJoin", (busId) => {
    socket.join(busId);
    console.log(`Driver joined room for bus: ${busId}`);
  });

  // Driver sends location updates
  socket.on("busLocationUpdate", (data) => {
    console.log("Received location:", data);
    // Send to all users in the same bus room
    io.to(data.busId).emit("locationUpdate", data);
  });

  // User wants to track a bus
  socket.on("trackBus", (busId) => {
    socket.join(busId);
    console.log(`User joined room to track bus: ${busId}`);
  });
});

console.log("🚀 Server running on ws://localhost:3000");
