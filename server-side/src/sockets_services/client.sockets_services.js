import { Bus } from "../models/bus.models.js";
import { isDriverOnline, getCurrentLocation } from "./bus.sockets_services.js";

// Store active passengers in memory
const activePassengers = new Map(); // socketId -> { busId, joinedAt, userInfo }

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
            if (activePassengers.has(socket.id)) {
                const previousBus = activePassengers.get(socket.id);
                socket.leave(`bus_${previousBus.busId}`);
            }
            
            // Join new bus room
            await socket.join(`bus_${busId}`);
            
            // Store passenger info in memory only
            activePassengers.set(socket.id, {
                busId,
                joinedAt: new Date(),
                userInfo: userInfo || { name: 'Anonymous Passenger' }
            });
            
            // Get current location from memory (if driver is online)
            const driverOnline = isDriverOnline(busId);
            const currentLocation = getCurrentLocation(busId);
            
            // Send current bus status to the new passenger
            socket.emit('passenger:joined', {
                busId,
                message: 'Successfully joined bus tracking',
                busInfo: {
                    busNumber: bus.busNumber,
                    routeName: bus.routeName,
                    capacity: bus.capacity,
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
            const passengerInfo = activePassengers.get(socket.id);
            if (!passengerInfo || passengerInfo.busId !== busId) {
                socket.emit('passenger:error', { message: 'Not authorized to access this bus data' });
                return;
            }
            
            // Get current location from memory
            const driverOnline = isDriverOnline(busId);
            const currentLocation = getCurrentLocation(busId);
            
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
            const passengerInfo = activePassengers.get(socket.id);
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
        const passengerInfo = activePassengers.get(socketId);
        
        if (passengerInfo) {
            const disconnectedBusId = busId || passengerInfo.busId;
            
            // Remove from active passengers (memory only)
            activePassengers.delete(socketId);
            
            // Notify other passengers about decreased count
            const driverOnline = isDriverOnline(disconnectedBusId);
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
export const getActivePassengers = () => {
    return Array.from(activePassengers.entries()).map(([socketId, info]) => ({
        socketId,
        busId: info.busId,
        joinedAt: info.joinedAt,
        userInfo: info.userInfo
    }));
};

// Get passenger count for a specific bus
export const getPassengerCount = (busId) => {
    return Array.from(activePassengers.values())
        .filter(passenger => passenger.busId === busId).length;
};

// Get all buses with passenger counts
export const getBusPassengerCounts = () => {
    const counts = new Map();
    
    for (const passenger of activePassengers.values()) {
        counts.set(passenger.busId, (counts.get(passenger.busId) || 0) + 1);
    }
    
    return Object.fromEntries(counts);
};