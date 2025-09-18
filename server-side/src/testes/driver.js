import { io } from "socket.io-client";

const socket = io("https://where-is-mybus.onrender.com" , {
  transports: ["websocket"]
});
// const socket = io("http://localhost:5001", {
//   transports: ["websocket"]
// });

// ✅ Wait for socket connection before emitting anything
socket.on("connect", () => {
    console.log("🔌 Connected as driver:", socket.id);

    // Step 1: Identify as driver
    socket.emit("identify", { type: "driver", token: "320491", busId: "BUS123" });

    // Step 2: Join bus as driver
    // 🔹 Moved inside identify:success to ensure server has registered driver listener
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

    // Send location every 5 seconds
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

// Listen for errors
socket.on("driver:error", (err) => console.error("❌ Driver error:", err));

// Listen for location sent confirmation
socket.on("driver:location:sent", (msg) => console.log("📍 Location sent:", msg));
