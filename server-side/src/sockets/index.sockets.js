import { Server } from "socket.io";
import { handleDriverConnection } from "../sockets_services/bus.sockets_services.js";
import { handleClientConnection } from "../sockets_services/client.sockets_services.js";
import { redisClient } from "../db/redis.db.js";

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: { 
            origin: "*",
            methods: ["GET", "POST"]
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Make io globally available for cross-service communication
    global.io = io;

    io.on("connection", (socket) => {
        console.log(`🟢 New connection: ${socket.id}`);

        // Handle different types of connections based on client type
        socket.on("identify", async (data) => {
            try {
                const { type, token, busId } = data;
                

                if (type === "driver") {
                    console.log(`🚌 Identified as driver: ${socket.id}`);

                    const uniqueKey = `busToken:${busId}`;

                const client = redisClient();
                const storedToken = await client.get(uniqueKey);

                if (!storedToken || storedToken !== token) {
                    console.log(`❌ Invalid token for ${socket.id}`);
                    socket.emit("identify:error", { message: "Invalid token" });
                    socket.disconnect(true);
                    return;
                }
                     socket.emit("identify:success");
                     socket.data.type="driver";
                    handleDriverConnection(io, socket);
                } else if (type === "passenger") {
                    console.log(`👥 Identified as passenger: ${socket.id}`);
                    handleClientConnection(io, socket);
                } else {
                    console.log(`❓ Unknown client type: ${type} for ${socket.id}`);
                    socket.emit("error", { message: "Please identify as driver or passenger" });
                }
            } catch (err) {
                console.error(`❌ Redis token check failed for ${socket.id}:`, err);
                socket.emit("error", { message: "Server error while verifying token" });
            }
        });

        // Auto-identify as passenger if not identified within 5 sec
        let identificationTimer = setTimeout(() => {
            console.log(`👥 Auto-identifying as passenger: ${socket.id}`);
            handleClientConnection(io, socket);
        }, 5000);

        // Clear timer if client identifies
        socket.on("identify", () => {
            clearTimeout(identificationTimer);
        });

        // Admin/monitoring endpoints
        socket.on("admin:stats", () => {
            if (socket.handshake.query.admin === "true") {
                const stats = {
                    totalConnections: io.sockets.sockets.size,
                    totalRooms: io.sockets.adapter.rooms.size,
                    timestamp: new Date().toISOString()
                };
                socket.emit("admin:stats:response", stats);
            } else {
                socket.emit("error", { message: "Admin access required" });
            }
        });

        // Global disconnect handler
        socket.on("disconnect", (reason) => {
            console.log(`🔴 Disconnected: ${socket.id}, Reason: ${reason}`);
            clearTimeout(identificationTimer);
        });

        // Error handling
        socket.on("error", (error) => {
            console.error(`❌ Socket error from ${socket.id}:`, error);
        });
    });

    // Periodic cleanup and monitoring
    setInterval(() => {
        const connectedClients = io.sockets.sockets.size;
        const activeRooms = io.sockets.adapter.rooms.size;
        
        if (connectedClients > 0) {
            console.log(`📊 Active connections: ${connectedClients}, Active rooms: ${activeRooms}`);
        }
    }, 300000); // Every 5 minutes

    console.log("✅ Socket.IO server initialized successfully");
    return io;
};

// Utility function to get socket instance
export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO not initialized");
    }
    return io;
};

// Utility function to broadcast to all buses
export const broadcastToAllBuses = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};

// Utility function to broadcast to specific bus
export const broadcastToBus = (busId, event, data) => {
    if (io) {
        io.to(`bus_${busId}`).emit(event, data);
    }
};
