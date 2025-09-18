import { createClient } from "redis";   
import  dotenv from "dotenv";
dotenv.config({
    path:'../../.env'
})


const redisClient = createClient({
  url: process.env.REDIS_URL
});

console.log("Redis URL:", process.env.REDIS_URL); // Debugging line

redisClient.on("error", (err) => console.log("Redis Client Error", err));

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Redis client connected.....    ");
  }
};
export { connectRedis, redisClient };