import { redisClient } from "../db/redis.db.js";
export  const check = async () => {

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

    // fetch values for each key based on its type
    for (const key of keys) {
      try {
        // Get the type of the key first
        const keyType = await client.type(key);
        
        let value;
        switch (keyType) {
          case 'string':
            value = await client.get(key);
            console.log(`[${key} (string): ${value}]`);
            break;
          case 'hash':
            const hashValues = await client.hGetAll(key);
            console.log(`[${key} (hash): ${JSON.stringify(hashValues)}]`);
            break;
          case 'list':
            const listValues = await client.lRange(key, 0, -1);
            console.log(`[${key} (list): ${JSON.stringify(listValues)}]`);
            break;
          case 'set':
            const setValues = await client.sMembers(key);
            console.log(`[${key} (set): ${JSON.stringify(setValues)}]`);
            break;
          case 'zset':
            const zsetValues = await client.zRange(key, 0, -1, { withScores: true });
            console.log(`[${key} (zset): ${JSON.stringify(zsetValues)}]`);
            break;
          default:
            console.log(`[${key} (${keyType}): Unknown type]`);
        }
      } catch (error) {
        console.error(`❌ Error reading key ${key}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in Redis check function:', error);
  }
};