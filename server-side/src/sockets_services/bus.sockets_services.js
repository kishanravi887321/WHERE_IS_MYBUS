import { Bus } from "../models/bus.models.js";
import { BusLocation } from "../models/busLocation.models.js";

// Store active drivers in memory for quick lookup
const activeBuses = new Map(); // busId -> { socketId, lastUpdate, driverInfo }

export const handleDriverConnection = (io, socket) => {
    console.log(`🚌 Driver connected: ${socket.id}`);
    
    // Driver joins with unique bus ID and driver key
    socket.on('driver:join', async (data) => {
        try {
            const { busId, driverKey, driverInfo } = data;
            
            console.log(`🔑 Driver attempting to join bus ${busId} with key: ${driverKey}`);
            
            // Validate bus exists and driver key is correct
            const bus = await Bus.findOne({ busId, isActive: true });
            if (!bus) {
                socket.emit('driver:error', { message: 'Bus not found or inactive' });
                return;
            }
            
            // For demo purposes, using simple key validation
            // In production, use proper authentication
            const expectedKey = `driver_${busId}_2024`;
            if (driverKey !== expectedKey) {
                socket.emit('driver:error', { message: 'Invalid driver key' });
                return;
            }
            
            // Check if another driver is already active for this bus
            if (activeBuses.has(busId)) {
                const existingDriver = activeBuses.get(busId);
                // Disconnect existing driver
                io.to(existingDriver.socketId).emit('driver:displaced', { 
                    message: 'Another driver has taken control of this bus' 
                });
                io.sockets.sockets.get(existingDriver.socketId)?.leave(`bus_${busId}`);
            }
            
            // Join bus room
            await socket.join(`bus_${busId}`);
            
            // Store driver info
            activeBuses.set(busId, {
                socketId: socket.id,
                lastUpdate: new Date(),
                driverInfo: driverInfo || { name: 'Unknown Driver' },
                busId
            });
            
            // Update bus location record
            await BusLocation.updateLocation(busId, {
                driverSocketId: socket.id,
                isDriverOnline: true,
                location: bus.currentLocation.latitude && bus.currentLocation.longitude 
                    ? {
                        latitude: bus.currentLocation.latitude,
                        longitude: bus.currentLocation.longitude
                    }
                    : { latitude: 0, longitude: 0 }
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
            
            // Validate driver is authorized for this bus
            const busInfo = activeBuses.get(busId);
            if (!busInfo || busInfo.socketId !== socket.id) {
                socket.emit('driver:error', { message: 'Unauthorized location update' });
                return;
            }
            
            // Validate location data
            if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
                socket.emit('driver:error', { message: 'Invalid location data' });
                return;
            }
            
            // Update last update time
            busInfo.lastUpdate = new Date();
            activeBuses.set(busId, busInfo);
            
            // Update database
            const updatedLocation = await BusLocation.updateLocation(busId, {
                location,
                speed: speed || 0,
                heading: heading || 0,
                accuracy: accuracy || 0,
                driverSocketId: socket.id,
                isDriverOnline: true
            });
            
            // Update bus current location
            await Bus.findOneAndUpdate(
                { busId },
                {
                    'currentLocation.latitude': location.latitude,
                    'currentLocation.longitude': location.longitude,
                    'currentLocation.lastUpdated': new Date()
                }
            );
            
            // Broadcast to all passengers in the bus room
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
            socket.emit('driver:location:sent', {
                busId,
                timestamp: new Date().toISOString(),
                passengersNotified: io.sockets.adapter.rooms.get(`bus_${busId}`)?.size - 1 || 0
            });
            
            console.log(`📍 Location updated for bus ${busId}: ${location.latitude}, ${location.longitude}`);
            
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
            for (const [bid, info] of activeBuses.entries()) {
                if (info.socketId === socketId) {
                    disconnectedBusId = bid;
                    break;
                }
            }
        }
        
        if (disconnectedBusId) {
            // Remove from active drivers
            activeBuses.delete(disconnectedBusId);
            
            // Update database
            await BusLocation.updateLocation(disconnectedBusId, {
                driverSocketId: null,
                isDriverOnline: false
            });
            
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
export const getActiveBuses = () => {
    return Array.from(activeBuses.entries()).map(([busId, info]) => ({
        busId,
        driverSocketId: info.socketId,
        lastUpdate: info.lastUpdate,
        driverInfo: info.driverInfo
    }));
};

// Check if driver is online for a specific bus
export const isDriverOnline = (busId) => {
    return activeBuses.has(busId);
};