import { Bus } from "../models/bus.models.js";
import { redisClient } from "../db/redis.db.js";

// Redis cache helper functions for driver management
const REDIS_KEYS = {
    ACTIVE_BUSES: 'active_buses',
    BUS_PREFIX: 'bus:',
    DRIVER_PREFIX: 'driver:'
};

// Helper functions to interact with Redis
const getRedisClient = () => {
    return redisClient();
};

const setActiveBus = async (busId, busData) => {
    try {
        const client = getRedisClient();
        await client.hSet(REDIS_KEYS.ACTIVE_BUSES, busId, JSON.stringify({
            ...busData,
            lastUpdate: new Date().toISOString()
        }));
        console.log(`✅ Bus ${busId} cached in Redis`);
    } catch (error) {
        console.error('❌ Error setting active bus in Redis:', error);
    }
};

const getActiveBus = async (busId) => {
    try {
        const client = getRedisClient();
        const busData = await client.hGet(REDIS_KEYS.ACTIVE_BUSES, busId);
        return busData ? JSON.parse(busData) : null;
    } catch (error) {
        console.error('❌ Error getting active bus from Redis:', error);
        return null;
    }
};

const hasActiveBus = async (busId) => {
    try {
        const client = getRedisClient();
        return await client.hExists(REDIS_KEYS.ACTIVE_BUSES, busId);
    } catch (error) {
        console.error('❌ Error checking active bus in Redis:', error);
        return false;
    }
};

const deleteActiveBus = async (busId) => {
    try {
        const client = getRedisClient();
        await client.hDel(REDIS_KEYS.ACTIVE_BUSES, busId);
        console.log(`🗑️ Bus ${busId} removed from Redis cache`);
    } catch (error) {
        console.error('❌ Error deleting active bus from Redis:', error);
    }
};

const getAllActiveBuses = async () => {
    try {
        const client = getRedisClient();
        const busesData = await client.hGetAll(REDIS_KEYS.ACTIVE_BUSES);
        const result = [];
        for (const [busId, data] of Object.entries(busesData)) {
            result.push([busId, JSON.parse(data)]);
        }
        return result;
    } catch (error) {
        console.error('❌ Error getting all active buses from Redis:', error);
        return [];
    }
};

export const handleDriverConnection = (io, socket) => {
    console.log(`🚌 Driver connected: ${socket.id}`);
    
    // Driver joins with unique bus ID and driver key
    socket.on('driver:join', async (data) => {
        if(socket.data.type !== "driver"){
            socket.emit("error", {message:"Unauthorized: Please identify as driver first"});
            socket.disconnect(true);
            return;
        }
        try {
            const { busId, secretKey, driverInfo } = data;

            console.log(`🔑 Driver attempting to join bus ${busId}`);

            // Validate bus exists and is active
            const bus = await Bus.findOne({ busId, isActive: true });
            if (!bus) {
                socket.emit('driver:error', { message: 'Bus not found or inactive' });
                return;
            }
            
            // For demo purposes, using simple key validation
            // In production, use proper authentication
           
            
            // Check if another driver is already active for this bus
            const existingBusData = await getActiveBus(busId);
            if (existingBusData) {
                // Disconnect existing driver
                io.to(existingBusData.socketId).emit('driver:displaced', { 
                    message: 'Another driver has taken control of this bus' 
                });
                io.sockets.sockets.get(existingBusData.socketId)?.leave(`bus_${busId}`);
            }
            
            // Join bus room
            await socket.join(`bus_${busId}`);
            
            // Store driver info in Redis cache
            await setActiveBus(busId, {
                socketId: socket.id,
                driverInfo: driverInfo || { name: 'Unknown Driver' },
                busId,
                currentLocation: null // Will be updated when driver sends location
            });
            
            socket.emit('driver:joined', { 
                busId, 
                message: 'Successfully joined as driver',
                busInfo: {
                    busNumber: bus.busNumber,
                    routeName: bus.routeName,
                    capacity: bus.capacity
                }
            });
            
            // Notify passengers in the room
            socket.to(`bus_${busId}`).emit('driver:online', {
                busId,
                driverInfo: driverInfo || { name: 'Driver' },
                timestamp: new Date().toISOString()
            });
            
            console.log(`✅ Driver joined bus ${busId} successfully`);
            
        } catch (error) {
            console.error('❌ Error in driver:join:', error);
            socket.emit('driver:error', { message: 'Failed to join as driver' });
        }
    });
    
    // Driver sends location update
    socket.on('driver:location', async (data) => {
        try {
            const { busId, location, speed, heading, accuracy } = data;
            console.log(`📍 Received location from bus ${busId}:`, location);
            
            // Validate driver is authorized for this bus
            const busInfo = await getActiveBus(busId);
            if (!busInfo || busInfo.socketId !== socket.id) {
                socket.emit('driver:error', { message: 'Unauthorized location update' });
                return;
            }
            
            // Validate location data
            if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
                socket.emit('driver:error', { message: 'Invalid location data' });
                return;
            }
            
            // Update Redis cache data only (no database save)
            busInfo.currentLocation = {
                location,
                speed: speed || 0,
                heading: heading || 0,
                accuracy: accuracy || 0,
                timestamp: new Date().toISOString()
            };
            await setActiveBus(busId, busInfo);
            
            // Broadcast to all passengers in the bus room immediately
            const locationUpdate = {
                busId,
                location,
                speed: speed || 0,
                heading: heading || 0,
                accuracy: accuracy || 0,
                timestamp: new Date().toISOString(),
                driverOnline: true
            };
            
            socket.to(`bus_${busId}`).emit('bus:location', locationUpdate);
            
            // Send confirmation to driver
            const roomSize = io.sockets.adapter.rooms.get(`bus_${busId}`)?.size || 1;
            socket.emit('driver:location:sent', {
                busId,
                timestamp: new Date().toISOString(),
                passengersNotified: roomSize - 1 // Subtract driver from count
            });
            
            console.log(`📍 Location broadcasted for bus ${busId}: ${location.latitude}, ${location.longitude} to ${roomSize - 1} passengers`);
            
        } catch (error) {
            console.error('❌ Error in driver:location:', error);
            socket.emit('driver:error', { message: 'Failed to update location' });
        }
    });
    
    // Driver goes offline
    socket.on('driver:offline', async (data) => {
        const { busId } = data || {};
        await handleDriverDisconnect(socket.id, busId);
    });
    
    // Handle driver disconnect
    socket.on('disconnect', async () => {
        console.log(`🚌 Driver disconnected: ${socket.id}`);
        await handleDriverDisconnect(socket.id);
    });
};

// Helper function to handle driver disconnect
const handleDriverDisconnect = async (socketId, busId = null) => {
    try {
        // Find which bus this driver was connected to
        let disconnectedBusId = busId;
        
        if (!disconnectedBusId) {
            const allBuses = await getAllActiveBuses();
            for (const [bid, info] of allBuses) {
                if (info.socketId === socketId) {
                    disconnectedBusId = bid;
                    break;
                }
            }
        }
        
        if (disconnectedBusId) {
            // Remove from Redis cache
            await deleteActiveBus(disconnectedBusId);
            
            // Notify passengers
            global.io?.to(`bus_${disconnectedBusId}`).emit('driver:offline', {
                busId: disconnectedBusId,
                message: 'Driver is now offline',
                timestamp: new Date().toISOString()
            });
            
            console.log(`🔴 Driver for bus ${disconnectedBusId} went offline`);
        }
    } catch (error) {
        console.error('❌ Error handling driver disconnect:', error);
    }
};

// Get active buses (for admin/monitoring)
export const getActiveBuses = async () => {
    try {
        const allBuses = await getAllActiveBuses();
        return allBuses.map(([busId, info]) => ({
            busId,
            driverSocketId: info.socketId,
            lastUpdate: info.lastUpdate,
            driverInfo: info.driverInfo,
            currentLocation: info.currentLocation
        }));
    } catch (error) {
        console.error('❌ Error getting active buses:', error);
        return [];
    }
};

// Check if driver is online for a specific bus
export const isDriverOnline = async (busId) => {
    try {
        return await hasActiveBus(busId);
    } catch (error) {
        console.error('❌ Error checking driver online status:', error);
        return false;
    }
};

// Get current location for a specific bus (from Redis cache)
export const getCurrentLocation = async (busId) => {
    try {
        const busInfo = await getActiveBus(busId);
        return busInfo?.currentLocation || null;
    } catch (error) {
        console.error('❌ Error getting current location:', error);
        return null;
    }
};