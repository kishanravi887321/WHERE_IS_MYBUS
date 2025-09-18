import { createClient } from "redis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the current directory for ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the root directory (WHERE_IS_MYBUS/.env)
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log("🔧 Environment variables loaded:");
console.log("REDIS_URL:", process.env.REDIS_URL ? "✅ Found" : "❌ Not found");

// ✅ Replace with your actual Redis URL
const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
    console.error("❌ REDIS_URL is not defined in environment variables");
    process.exit(1);
}
const deleteAllKeys = async () => {
    const client = createClient({ url: REDIS_URL });

    client.on("error", (err) => console.error("Redis Client Error:", err));

    try {
        // Connect to Redis
        await client.connect();
        console.log("✅ Redis client connected");

        // Fetch all keys
        const keys = await client.keys("*");
        if (keys.length === 0) {
            console.log("No keys found to delete");
        } else {
            await client.del(keys);
            console.log(`✅ Deleted keys: ${keys.join(", ")}`);
        }
    } catch (err) {
        console.error("❌ Failed to delete keys:", err);
    } finally {
        // Close connection
        await client.disconnect();
        console.log("🔌 Redis client disconnected");
    }
};

deleteAllKeys();
