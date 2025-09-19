import { io } from "socket.io-client";

const socket = io("https://where-is-mybus.onrender.com", {
  transports: ["websocket"]
});
// const socket = io("http://localhost:5001", {
//   transports: ["websocket"]
// });

// ✅ Initial starting location (Delhi coords)
let currentLocation = {
  latitude: 28.7041,
  longitude: 77.1025
};

// ✅ Function to generate next location (small realistic movement)
function getNextLocation() {
  // Random delta ~ between -0.0002 and +0.0002 (~20m variation)
  const deltaLat = (Math.random() - 0.5) * 0.0004;
  const deltaLng = (Math.random() - 0.5) * 0.0004;

  currentLocation.latitude += deltaLat;
  currentLocation.longitude += deltaLng;

  return { ...currentLocation };
}

// ✅ Wait for socket connection before emitting anything
socket.on("connect", () => {
  console.log("🔌 Connected as driver:", socket.id);

  // Step 1: Identify as driver
  socket.emit("identify", { type: "driver", token: "965593", busId: "BUS123" });
});

// Listen for identify success
socket.on("identify:success", () => {
  console.log("✅ Identified as driver, now joining bus");

  socket.emit("driver:join", {
    busId: "BUS123",
    driverInfo: { name: "Rajesh Kumar" }
  });
});

// Listen for identify errors
socket.on("identify:error", (err) => {
  console.error("❌ Identification error:", err);
  socket.disconnect();
});

// Listen for successful join
socket.on("driver:joined", (data) => {
  console.log("✅ Driver joined:", data);

  // Send location every 1 second with realistic movement
  setInterval(() => {
    const newLocation = getNextLocation();

    socket.emit("driver:location", {
      busId: "BUS123",
      location: newLocation,
      speed: 30 + Math.floor(Math.random() * 20), // random speed 30–50
      heading: Math.floor(Math.random() * 360)    // random direction
    });
  }, 1000);
});

// Listen for errors
socket.on("driver:error", (err) => console.error("❌ Driver error:", err));

// Listen for location sent confirmation
socket.on("driver:location:sent", (msg) =>
  console.log("📍 Location sent:", msg)
);
