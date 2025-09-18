// backend/src/server.js
import dotenv from "dotenv";
import http from "http";
import {app} from "./app.js"; // Express app
import connectDB from "./db/index.db.js";
import  {initSocket} from "./sockets/index.sockets.js";
import { connectRedis ,redisClient} from "./db/redis.db.js";



dotenv.config({ path: "../.env" });


console.log("PORT:", process.env.PORT);
console.log("REDIS_URL:", process.env.REDIS_URL ? "✅ Loaded" : "❌ Not found");
console.log("DB_URL:", process.env.DB_URL ? "✅ Loaded" : "❌ Not found");

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // 1️⃣ Connect MongoDB
    await connectDB();
    console.log("✅ MongoDB connected");
    await connectRedis();
    // 3️⃣ Delay 3 seconds before running Redis check
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await check();


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

const check = async () => {
  try {
    const client = redisClient();
    
    // Ensure client is connected
    if (!client.isOpen) {
      await client.connect();
    }

    // fetch all keys
    const keys = await client.keys("*");

    if (keys.length === 0) {
      console.log("No keys found in Redis.");
      return;
    }

    // fetch values for each key
    for (const key of keys) {
      const value = await client.get(key);  // ❗ use hgetall if it's a hash
      console.log(`[${key} : ${value}]`);
    }
  } catch (error) {
    console.error('❌ Error in Redis check function:', error);
  }
};

startServer();

 
const deleteAllKeys = async () => {
   try {
     const client = redisClient();
     
     // Ensure client is connected
     if (!client.isOpen) {
       await client.connect();
     }
     
     const keys = await client.keys("*");
     if (keys.length > 0) {
         await client.del(keys);
         console.log(`Deleted keys: ${keys.join(", ")}`);
     } else {
         console.log("No keys found to delete");
     }
   } catch (error) {
     console.error('❌ Error deleting Redis keys:', error);
   }
};

// Comment out the auto-run deleteAllKeys to prevent conflicts
// (async () => {
//     try {
//         await deleteAllKeys();
//     } catch (err) {
//         console.error("❌ Redis test failed:", err);
//     }
// })();

//