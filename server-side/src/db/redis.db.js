import { createClient } from "redis";   

// Note: dotenv is already configured in index.js, so no need to configure it again here

let redisClient = null;

// Function to initialize Redis client after environment variables are loaded
const initializeRedisClient = () => {
    if (!redisClient) {
        console.log("Initializing Redis client...");
        console.log("Redis URL:", process.env.REDIS_URL); // Debugging line
        
        redisClient = createClient({
            url: process.env.REDIS_URL
        });

        redisClient.on("error", (err) => console.log("Redis Client Error", err));
    }
    return redisClient;
};

const connectRedis = async () => {
  const client = initializeRedisClient();
  
  if (!client.isOpen) {
    await client.connect();
    console.log("Redis client connected.....    ");
  }
};

// Function to get the Redis client (initialize if needed)
const getRedisClient = () => {
    return initializeRedisClient();
};

export { connectRedis, getRedisClient as redisClient };