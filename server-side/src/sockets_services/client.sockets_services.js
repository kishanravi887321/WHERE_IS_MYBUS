import { Bus } from "../models/bus.models.js";
import { redisClient } from "../db/redis.db.js";
import { isDriverOnline, getCurrentLocation } from "./bus.sockets_services.js";

// Redis cache helper functions for passenger management
const REDIS_KEYS = {
    ACTIVE_PASSENGERS: 'active_passengers',
    PASSENGER_PREFIX: 'passenger:'
};

// Helper functions to interact with Redis
const getRedisClient = async () => {
    const client = redisClient();
    
    // Ensure client is connected before returning
    if (!client.isOpen) {
        await client.connect();
    }
    
    return client;
};

const setActivePassenger = async (socketId, passengerData) => {
    try {
        const client = await getRedisClient();
        await client.hSet(REDIS_KEYS.ACTIVE_PASSENGERS, socketId, JSON.stringify({
            ...passengerData,
            lastUpdate: new Date().toISOString()
        }));
        console.log(`✅ Passenger ${socketId} cached in Redis`);
    } catch (error) {
        console.error('❌ Error setting active passenger in Redis:', error);
    }
};

const getActivePassenger = async (socketId) => {
    try {
        const client = await getRedisClient();
        const passengerData = await client.hGet(REDIS_KEYS.ACTIVE_PASSENGERS, socketId);
        return passengerData ? JSON.parse(passengerData) : null;
    } catch (error) {
        console.error('❌ Error getting active passenger from Redis:', error);
        return null;
    }
};

const hasActivePassenger = async (socketId) => {
    try {
        const client = await getRedisClient();
        return await client.hExists(REDIS_KEYS.ACTIVE_PASSENGERS, socketId);
    } catch (error) {
        console.error('❌ Error checking active passenger in Redis:', error);
        return false;
    }
};

const deleteActivePassenger = async (socketId) => {
    try {
        const client = await getRedisClient();
        await client.hDel(REDIS_KEYS.ACTIVE_PASSENGERS, socketId);
        console.log(`🗑️ Passenger ${socketId} removed from Redis cache`);
    } catch (error) {
        console.error('❌ Error deleting active passenger from Redis:', error);
    }
};

const getAllActivePassengers = async () => {
    try {
        const client = await getRedisClient();
        const passengersData = await client.hGetAll(REDIS_KEYS.ACTIVE_PASSENGERS);
        const result = [];
        for (const [socketId, data] of Object.entries(passengersData)) {
            result.push([socketId, JSON.parse(data)]);
        }
        return result;
    } catch (error) {
        console.error('❌ Error getting all active passengers from Redis:', error);
        return [];
    }
};

export const handleClientConnection = (io, socket) => {
    console.log(`👥 Passenger connected: ${socket.id}`);
    
    // Passenger joins a bus room to track location
    socket.on('passenger:join', async (data) => {
        try {
            const { busId, userInfo } = data;
            
            console.log(`🚌 Passenger ${socket.id} attempting to join bus ${busId}`);
            
            // Validate bus exists and is active
            const bus = await Bus.findOne({ busId, isActive: true });
            if (!bus) {
                socket.emit('passenger:error', { message: 'Bus not found or inactive' });
                return;
            }
            
            // Leave any previous bus room
            const previousPassengerData = await getActivePassenger(socket.id);
            if (previousPassengerData) {
                socket.leave(`bus_${previousPassengerData.busId}`);
            }
            
            // Join new bus room
            await socket.join(`bus_${busId}`);
            
            // Store passenger info in Redis cache
            await setActivePassenger(socket.id, {
                busId,
                joinedAt: new Date().toISOString(),
                userInfo: userInfo || { name: 'Anonymous Passenger' }
            });
            
            // Get current location from Redis cache (if driver is online)
            const driverOnline = await isDriverOnline(busId);
            const currentLocation = await getCurrentLocation(busId);
            
            // Send current bus status to the new passenger
            socket.emit('passenger:joined', {
                busId,
                message: 'Successfully joined bus tracking',
                busInfo: {
                    busNumber: bus.busNumber,
                    routeName: bus.routeName,
                    capacity: bus.capacity,
                    currentOccupancy: bus.currentOccupancy,
                    driverName: bus.driverName
                },
                currentLocation: currentLocation,
                driverOnline,
                passengerCount: (io.sockets.adapter.rooms.get(`bus_${busId}`)?.size || 1) - (driverOnline ? 1 : 0)
            });
            
            // Notify other passengers about new passenger (optional)
            socket.to(`bus_${busId}`).emit('passenger:joined:notification', {
                busId,
                passengerCount: (io.sockets.adapter.rooms.get(`bus_${busId}`)?.size || 1) - (driverOnline ? 1 : 0),
                newPassenger: userInfo?.name || 'A passenger'
            });
            
            console.log(`✅ Passenger joined bus ${busId} successfully`);
            
        } catch (error) {
            console.error('❌ Error in passenger:join:', error);
            socket.emit('passenger:error', { message: 'Failed to join bus tracking' });
        }
    });
    
    // Passenger requests current location
    socket.on('passenger:location:request', async (data) => {
        try {
            const { busId } = data;
            
            // Verify passenger is in this bus room
            const passengerInfo = await getActivePassenger(socket.id);
            if (!passengerInfo || passengerInfo.busId !== busId) {
                socket.emit('passenger:error', { message: 'Not authorized to access this bus data' });
                return;
            }
            
            // Get current location from Redis cache
            const driverOnline = await isDriverOnline(busId);
            const currentLocation = await getCurrentLocation(busId);
            
            if (currentLocation && driverOnline) {
                socket.emit('bus:location', {
                    busId,
                    location: currentLocation.location,
                    speed: currentLocation.speed,
                    heading: currentLocation.heading,
                    accuracy: currentLocation.accuracy,
                    timestamp: currentLocation.timestamp,
                    driverOnline: true
                });
            } else {
                socket.emit('passenger:info', {
                    message: driverOnline ? 'Waiting for location data from driver' : 'Driver is currently offline',
                    driverOnline
                });
            }
            
        } catch (error) {
            console.error('❌ Error in passenger:location:request:', error);
            socket.emit('passenger:error', { message: 'Failed to get location data' });
        }
    });
    
    // Passenger leaves bus tracking
    socket.on('passenger:leave', async (data) => {
        const { busId } = data || {};
        await handlePassengerDisconnect(socket.id, busId);
    });
    
    // Passenger requests bus route information
    socket.on('passenger:route:request', async (data) => {
        try {
            const { busId } = data;
            
            // Verify passenger is in this bus room
            const passengerInfo = await getActivePassenger(socket.id);
            if (!passengerInfo || passengerInfo.busId !== busId) {
                socket.emit('passenger:error', { message: 'Not authorized to access this bus data' });
                return;
            }
            
            const bus = await Bus.findOne({ busId });
            if (bus && bus.route) {
                socket.emit('bus:route', {
                    busId,
                    route: bus.route,
                    timestamp: new Date().toISOString()
                });
            } else {
                socket.emit('passenger:info', { message: 'Route information not available' });
            }
            
        } catch (error) {
            console.error('❌ Error in passenger:route:request:', error);
            socket.emit('passenger:error', { message: 'Failed to get route information' });
        }
    });
    
    // Handle passenger disconnect
    socket.on('disconnect', async () => {
        console.log(`👥 Passenger disconnected: ${socket.id}`);
        await handlePassengerDisconnect(socket.id);
    });
};

// Helper function to handle passenger disconnect
const handlePassengerDisconnect = async (socketId, busId = null) => {
    try {
        const passengerInfo = await getActivePassenger(socketId);
        
        if (passengerInfo) {
            const disconnectedBusId = busId || passengerInfo.busId;
            
            // Remove from Redis cache
            await deleteActivePassenger(socketId);
            
            // Notify other passengers about decreased count
            const driverOnline = await isDriverOnline(disconnectedBusId);
            const roomSize = global.io?.sockets.adapter.rooms.get(`bus_${disconnectedBusId}`)?.size || 0;
            const passengerCount = Math.max(0, roomSize - (driverOnline ? 1 : 0));
            
            global.io?.to(`bus_${disconnectedBusId}`).emit('passenger:left:notification', {
                busId: disconnectedBusId,
                passengerCount,
                leftPassenger: passengerInfo.userInfo?.name || 'A passenger'
            });
            
            console.log(`🔴 Passenger left bus ${disconnectedBusId}`);
        }
    } catch (error) {
        console.error('❌ Error handling passenger disconnect:', error);
    }
};

// Get active passengers (for admin/monitoring)
export const getActivePassengers = async () => {
    try {
        const allPassengers = await getAllActivePassengers();
        return allPassengers.map(([socketId, info]) => ({
            socketId,
            busId: info.busId,
            joinedAt: info.joinedAt,
            userInfo: info.userInfo
        }));
    } catch (error) {
        console.error('❌ Error getting active passengers:', error);
        return [];
    }
};

// Get passenger count for a specific bus
export const getPassengerCount = async (busId) => {
    try {
        const allPassengers = await getAllActivePassengers();
        return allPassengers.filter(([socketId, passenger]) => passenger.busId === busId).length;
    } catch (error) {
        console.error('❌ Error getting passenger count:', error);
        return 0;
    }
};

// Get all buses with passenger counts
export const getBusPassengerCounts = async () => {
    try {
        const allPassengers = await getAllActivePassengers();
        const counts = new Map();
        
        for (const [socketId, passenger] of allPassengers) {
            counts.set(passenger.busId, (counts.get(passenger.busId) || 0) + 1);
        }
        
        return Object.fromEntries(counts);
    } catch (error) {
        console.error('❌ Error getting bus passenger counts:', error);
        return {};
    }
};