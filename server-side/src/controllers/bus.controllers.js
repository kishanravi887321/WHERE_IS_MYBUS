import { asyncHandler } from "../utils/asyncHandler.js";
import { Bus } from "../models/bus.models.js";
import { BusLocation } from "../models/busLocation.models.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getActiveBuses, isDriverOnline } from "../sockets_services/bus.sockets_services.js";
import { getBusPassengerCounts } from "../sockets_services/client.sockets_services.js";

// Create a new bus
const createBus = asyncHandler(async (req, res) => {
    const {ownerEmail, busId, busNumber, routeName, driverName, driverPhone, capacity, route } = req.body;

    // Check if bus with same ID or number already exists
    const existingBus = await Bus.findOne({
        $or: [{ busId }, { busNumber }]
    });

    if (existingBus) {
        throw new ApiError(409, "Bus with this ID or number already exists");
    }

    const bus = await Bus.create({
        ownerEmail,
        busId,
        busNumber,
        routeName,
        driverName,
        driverPhone,
        capacity,
        route: route || {}
    });

    return res.status(201).json(
        new ApiResponse(201, bus, "Bus created successfully")
    );
});

// Get all buses
const getAllBuses = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, isActive, routeName } = req.query;
    
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (routeName) filter.routeName = { $regex: routeName, $options: 'i' };

    const buses = await Bus.find(filter)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

    const total = await Bus.countDocuments(filter);

    // Add real-time status to each bus
    const activeBuses = getActiveBuses();
    const passengerCounts = getBusPassengerCounts();

    const busesWithStatus = buses.map(bus => {
        const isOnline = activeBuses.some(activeBus => activeBus.busId === bus.busId);
        return {
            ...bus.toObject(),
            isDriverOnline: isOnline,
            connectedPassengers: passengerCounts[bus.busId] || 0
        };
    });

    return res.status(200).json(
        new ApiResponse(200, {
            buses: busesWithStatus,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalBuses: total
        }, "Buses retrieved successfully")
    );
});

// Get bus by ID
const getBusById = asyncHandler(async (req, res) => {
    const { busId } = req.params;

    const bus = await Bus.findOne({ busId });
    if (!bus) {
        throw new ApiError(404, "Bus not found");
    }

    // Get latest location
    const latestLocation = await BusLocation.getLatestLocation(busId);
    
    // Get real-time status
    const isOnline = isDriverOnline(busId);
    const passengerCounts = getBusPassengerCounts();

    const busWithStatus = {
        ...bus.toObject(),
        isDriverOnline: isOnline,
        connectedPassengers: passengerCounts[busId] || 0,
        latestLocation: latestLocation ? {
            location: latestLocation.location,
            speed: latestLocation.speed,
            heading: latestLocation.heading,
            lastUpdated: latestLocation.lastSeen
        } : null
    };

    return res.status(200).json(
        new ApiResponse(200, busWithStatus, "Bus details retrieved successfully")
    );
});

// Update bus information
const updateBus = asyncHandler(async (req, res) => {
    const { busId } = req.params;
    const updateData = req.body;

    // Don't allow updating busId
    delete updateData.busId;

    const bus = await Bus.findOneAndUpdate(
        { busId },
        updateData,
        { new: true, runValidators: true }
    );

    if (!bus) {
        throw new ApiError(404, "Bus not found");
    }

    return res.status(200).json(
        new ApiResponse(200, bus, "Bus updated successfully")
    );
});

// Delete/Deactivate bus
const deleteBus = asyncHandler(async (req, res) => {
    const { busId } = req.params;
    const { permanent = false } = req.query;

    if (permanent === 'true') {
        const bus = await Bus.findOneAndDelete({ busId });
        if (!bus) {
            throw new ApiError(404, "Bus not found");
        }
        
        // Also delete location records
        await BusLocation.deleteMany({ busId });
    } else {
        const bus = await Bus.findOneAndUpdate(
            { busId },
            { isActive: false },
            { new: true }
        );
        
        if (!bus) {
            throw new ApiError(404, "Bus not found");
        }
    }

    return res.status(200).json(
        new ApiResponse(200, null, permanent === 'true' ? "Bus deleted permanently" : "Bus deactivated successfully")
    );
});

// Get bus location history
const getBusLocationHistory = asyncHandler(async (req, res) => {
    const { busId } = req.params;
    const { hours = 24, limit = 100 } = req.query;

    const bus = await Bus.findOne({ busId });
    if (!bus) {
        throw new ApiError(404, "Bus not found");
    }

    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const locations = await BusLocation.find({
        busId,
        createdAt: { $gte: startTime }
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    return res.status(200).json(
        new ApiResponse(200, {
            busId,
            locations,
            timeRange: `${hours} hours`,
            count: locations.length
        }, "Location history retrieved successfully")
    );
});

// Get active buses with live status
const getActiveBusesStatus = asyncHandler(async (req, res) => {
    const activeBusesData = getActiveBuses();
    const passengerCounts = getBusPassengerCounts();

    const statusData = await Promise.all(
        activeBusesData.map(async (activeBus) => {
            const bus = await Bus.findOne({ busId: activeBus.busId });
            const latestLocation = await BusLocation.getLatestLocation(activeBus.busId);
            
            return {
                busId: activeBus.busId,
                busNumber: bus?.busNumber || 'Unknown',
                routeName: bus?.routeName || 'Unknown',
                driverInfo: activeBus.driverInfo,
                lastUpdate: activeBus.lastUpdate,
                connectedPassengers: passengerCounts[activeBus.busId] || 0,
                currentLocation: latestLocation ? {
                    location: latestLocation.location,
                    speed: latestLocation.speed,
                    lastUpdated: latestLocation.lastSeen
                } : null
            };
        })
    );

    return res.status(200).json(
        new ApiResponse(200, {
            activeBuses: statusData,
            totalActiveBuses: statusData.length,
            timestamp: new Date().toISOString()
        }, "Active buses status retrieved successfully")
    );
});

// Search buses by route or location
const searchBuses = asyncHandler(async (req, res) => {
    const { query, latitude, longitude, radius = 5 } = req.query;

    let searchFilter = { isActive: true };

    if (query) {
        searchFilter.$or = [
            { busNumber: { $regex: query, $options: 'i' } },
            { routeName: { $regex: query, $options: 'i' } },
            { driverName: { $regex: query, $options: 'i' } }
        ];
    }

    let buses = await Bus.find(searchFilter);

    // If location-based search is requested
    if (latitude && longitude) {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const radiusKm = parseFloat(radius);

        // Get buses within radius
        const busesWithDistance = await Promise.all(
            buses.map(async (bus) => {
                const latestLocation = await BusLocation.getLatestLocation(bus.busId);
                
                if (latestLocation && latestLocation.location) {
                    const distance = calculateDistance(
                        lat, lng,
                        latestLocation.location.latitude,
                        latestLocation.location.longitude
                    );
                    
                    if (distance <= radiusKm) {
                        return {
                            ...bus.toObject(),
                            distance: Math.round(distance * 100) / 100,
                            currentLocation: latestLocation.location,
                            lastUpdated: latestLocation.lastSeen
                        };
                    }
                }
                return null;
            })
        );

        buses = busesWithDistance.filter(bus => bus !== null)
            .sort((a, b) => a.distance - b.distance);
    }

    return res.status(200).json(
        new ApiResponse(200, {
            buses,
            searchQuery: query || null,
            location: latitude && longitude ? { latitude, longitude, radius } : null,
            count: buses.length
        }, "Bus search completed successfully")
    );
});

// Helper function to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d;
};

export {
    createBus,
    getAllBuses,
    getBusById,
    updateBus,
    deleteBus,
    getBusLocationHistory,
    getActiveBusesStatus,
    searchBuses
};