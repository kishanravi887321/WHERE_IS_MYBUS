import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES6 module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file (three levels up - to project root)
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { createClient } from 'redis';

const clearRedis = async () => {
    console.log('🔄 Starting Redis cache clearing...');
    
    if (!process.env.REDIS_URL) {
        console.error('❌ REDIS_URL not found in environment variables');
        return;
    }
    
    console.log('✅ Redis URL found:', process.env.REDIS_URL.replace(/:[^:]*@/, ':****@'));
    
    const client = createClient({
        url: process.env.REDIS_URL
    });

    client.on('error', (err) => console.log('Redis Client Error', err));

    try {
        await client.connect();
        console.log('✅ Redis client connected successfully');

        // Get all keys
        const keys = await client.keys('*');
        console.log(`📋 Found ${keys.length} keys in Redis:`, keys);

        if (keys.length === 0) {
            console.log('✅ No keys to delete');
        } else {
            // Delete all keys
            await client.flushAll();
            console.log('🗑️  All Redis keys cleared successfully');
        }

        await client.disconnect();
        console.log('✅ Redis client disconnected');
        
    } catch (error) {
        console.error('❌ Error during Redis operations:', error);
    }
};

clearRedis();