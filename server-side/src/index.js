// backend/src/server.js
import dotenv from "dotenv";
import http from "http";
import {app} from "./app.js"; // Express app
import connectDB from "./db/index.db.js";
import  {initSocket} from "./sockets/index.sockets.js";

dotenv.config({ path: "../.env" });

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // 1️⃣ Connect MongoDB
    await connectDB();
    console.log("✅ MongoDB connected");

    // 2️⃣ Create HTTP server (bridge between Express + Socket.IO)
    const server = http.createServer(app);

    // 3️⃣ Initialize Socket.IO with the HTTP server
    initSocket(server);

    // 4️⃣ Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server startup failed", err);
    process.exit(1);
  }
};

startServer();
