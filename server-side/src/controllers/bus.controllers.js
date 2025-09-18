import { asyncHandler } from "../utils/asyncHandler.js";
import { Bus } from "../models/bus.models.js";
import { BusLocation } from "../models/busLocation.models.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getActiveBuses, isDriverOnline } from "../sockets_services/bus.sockets_services.js";
import { getBusPassengerCounts } from "../sockets_services/client.sockets_services.js";
import { redisClient } from "../db/redis.db.js";

// Create a new bus
const createBus = asyncHandler(async (req, res) => {
    const {ownerEmail, busId, secretKey, busNumber, routeName, driverName, driverPhone, capacity, route } = req.body;

    // Check if bus with same ID or number already exists
    const existingBus = await Bus.findOne({
        $or: [{ busId }, { busNumber }]
    });

    if (existingBus) {
        throw new ApiError(409, "Bus with this ID or number already exists");
    }

    const bus = await Bus.create({
        ownerEmail,
        secretKey,
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
    const activeBuses = await getActiveBuses();
    const passengerCounts = await getBusPassengerCounts();

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
    const isOnline = await isDriverOnline(busId);
    const passengerCounts = await getBusPassengerCounts();

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
    const activeBusesData = await getActiveBuses();
    const passengerCounts = await getBusPassengerCounts();

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

// Filter buses by boarding stop
const getBusesByBoardingStop = asyncHandler(async (req, res) => {
    const { stopName } = req.params;
    const { includeDriverStatus = false } = req.query;

    if (!stopName || stopName.trim() === '') {
        throw new ApiError(400, "Stop name is required");
    }

    // Get all active buses
    const buses = await Bus.find({ isActive: true });

    // Filter buses that pass through the specified stop
    const availableBuses = buses.filter(bus => {
        // Check if the bus has a route with stops
        if (!bus.route || !bus.route.stops || bus.route.stops.length === 0) {
            return false;
        }

        // Find the boarding stop in the route
        const boardingStop = bus.route.stops.find(stop => 
            stop.name && stop.name.toLowerCase().trim() === stopName.toLowerCase().trim()
        );

        if (!boardingStop) {
            return false; // Bus doesn't pass through this stop
        }

        // Get the highest order number (last stop)
        const maxOrder = Math.max(...bus.route.stops.map(stop => stop.order || 0));

        // Check if the bus continues beyond this stop (stop.order < maxOrder)
        // This ensures passengers can still board and reach further destinations
        return boardingStop.order < maxOrder;
    });

    // Add real-time status if requested
    let busesWithStatus = availableBuses;
    if (includeDriverStatus === 'true') {
        const activeBuses = await getActiveBuses();
        const passengerCounts = await getBusPassengerCounts();

        busesWithStatus = availableBuses.map(bus => {
            const isOnline = activeBuses.some(activeBus => activeBus.busId === bus.busId);
            const boardingStopDetails = bus.route.stops.find(stop => 
                stop.name.toLowerCase().trim() === stopName.toLowerCase().trim()
            );

            return {
                ...bus.toObject(),
                isDriverOnline: isOnline,
                connectedPassengers: passengerCounts[bus.busId] || 0,
                boardingStop: {
                    name: boardingStopDetails.name,
                    latitude: boardingStopDetails.latitude,
                    longitude: boardingStopDetails.longitude,
                    order: boardingStopDetails.order,
                    stopsRemaining: Math.max(...bus.route.stops.map(s => s.order || 0)) - boardingStopDetails.order
                }
            };
        });
    } else {
        busesWithStatus = availableBuses.map(bus => {
            const boardingStopDetails = bus.route.stops.find(stop => 
                stop.name.toLowerCase().trim() === stopName.toLowerCase().trim()
            );

            return {
                ...bus.toObject(),
                boardingStop: {
                    name: boardingStopDetails.name,
                    latitude: boardingStopDetails.latitude,
                    longitude: boardingStopDetails.longitude,
                    order: boardingStopDetails.order,
                    stopsRemaining: Math.max(...bus.route.stops.map(s => s.order || 0)) - boardingStopDetails.order
                }
            };
        });
    }

    return res.status(200).json(
        new ApiResponse(200, {
            stopName: stopName,
            availableBuses: busesWithStatus,
            totalBuses: busesWithStatus.length,
            searchTimestamp: new Date().toISOString()
        }, `Found ${busesWithStatus.length} buses passing through ${stopName}`)
    );
});

// Utility function to get available buses by boarding stop (for internal use)
export const getAvailableBusesByStop = async (stopName) => {
    try {
        // Get all active buses
        const buses = await Bus.find({ isActive: true });

        // Filter buses that pass through the specified stop
        const availableBuses = buses.filter(bus => {
            // Check if the bus has a route with stops
            if (!bus.route || !bus.route.stops || bus.route.stops.length === 0) {
                return false;
            }

            // Find the boarding stop in the route
            const boardingStop = bus.route.stops.find(stop => 
                stop.name && stop.name.toLowerCase().trim() === stopName.toLowerCase().trim()
            );

            if (!boardingStop) {
                return false; // Bus doesn't pass through this stop
            }

            // Get the highest order number (last stop)
            const maxOrder = Math.max(...bus.route.stops.map(stop => stop.order || 0));

            // Check if the bus continues beyond this stop
            return boardingStop.order < maxOrder;
        });

        return availableBuses.map(bus => {
            const boardingStopDetails = bus.route.stops.find(stop => 
                stop.name.toLowerCase().trim() === stopName.toLowerCase().trim()
            );

            return {
                busId: bus.busId,
                busNumber: bus.busNumber,
                routeName: bus.routeName,
                driverName: bus.driverName,
                capacity: bus.capacity,
                boardingStop: {
                    name: boardingStopDetails.name,
                    latitude: boardingStopDetails.latitude,
                    longitude: boardingStopDetails.longitude,
                    order: boardingStopDetails.order,
                    stopsRemaining: Math.max(...bus.route.stops.map(s => s.order || 0)) - boardingStopDetails.order
                },
                route: bus.route
            };
        });
    } catch (error) {
        console.error('Error getting buses by stop:', error);
        return [];
    }
};

// 🚌 Find buses that travel from one stop to another
const getBusesFromStopToStop = asyncHandler(async (req, res) => {
    const { fromStop, toStop } = req.params;
    const { includeDriverStatus = false } = req.query;

    // Validate input parameters
    if (!fromStop || fromStop.trim() === '') {
        throw new ApiError(400, "From stop name is required");
    }
    if (!toStop || toStop.trim() === '') {
        throw new ApiError(400, "To stop name is required");
    }
    if (fromStop.toLowerCase().trim() === toStop.toLowerCase().trim()) {
        throw new ApiError(400, "From stop and to stop cannot be the same");
    }

    // Get all active buses
    const buses = await Bus.find({ isActive: true });

    // Filter buses that travel from fromStop to toStop
    const validBuses = buses.filter(bus => {
        // Check if the bus has a route with stops
        if (!bus.route || !bus.route.stops || bus.route.stops.length < 2) {
            return false;
        }

        // Find both stops in the route
        const fromStopDetails = bus.route.stops.find(stop => 
            stop.name && stop.name.toLowerCase().trim() === fromStop.toLowerCase().trim()
        );
        
        const toStopDetails = bus.route.stops.find(stop => 
            stop.name && stop.name.toLowerCase().trim() === toStop.toLowerCase().trim()
        );

        // Both stops must exist in the route
        if (!fromStopDetails || !toStopDetails) {
            return false;
        }

        // fromStop must come BEFORE toStop (correct travel order)
        return fromStopDetails.order < toStopDetails.order;
    });

    // Add detailed information for each valid bus
    let busesWithJourneyDetails = validBuses.map(bus => {
        const fromStopDetails = bus.route.stops.find(stop => 
            stop.name.toLowerCase().trim() === fromStop.toLowerCase().trim()
        );
        
        const toStopDetails = bus.route.stops.find(stop => 
            stop.name.toLowerCase().trim() === toStop.toLowerCase().trim()
        );

        // Calculate journey details
        const stopsInBetween = bus.route.stops.filter(stop => 
            stop.order > fromStopDetails.order && stop.order < toStopDetails.order
        ).sort((a, b) => a.order - b.order);

        const totalStopsInJourney = toStopDetails.order - fromStopDetails.order;

        return {
            ...bus.toObject(),
            journeyDetails: {
                fromStop: {
                    name: fromStopDetails.name,
                    latitude: fromStopDetails.latitude,
                    longitude: fromStopDetails.longitude,
                    order: fromStopDetails.order
                },
                toStop: {
                    name: toStopDetails.name,
                    latitude: toStopDetails.latitude,
                    longitude: toStopDetails.longitude,
                    order: toStopDetails.order
                },
                stopsInBetween: stopsInBetween,
                totalStopsInJourney: totalStopsInJourney,
                estimatedJourneyTime: `${totalStopsInJourney * 15} minutes` // Assuming 15 mins per stop
            }
        };
    });

    // Add real-time status if requested
    if (includeDriverStatus === 'true') {
        const activeBuses = await getActiveBuses();
        const passengerCounts = await getBusPassengerCounts();

        busesWithJourneyDetails = busesWithJourneyDetails.map(bus => {
            const isOnline = activeBuses.some(activeBus => activeBus.busId === bus.busId);
            
            return {
                ...bus,
                isDriverOnline: isOnline,
                connectedPassengers: passengerCounts[bus.busId] || 0
            };
        });
    }

    return res.status(200).json(
        new ApiResponse(200, {
            fromStop: fromStop,
            toStop: toStop,
            availableBuses: busesWithJourneyDetails,
            totalBuses: busesWithJourneyDetails.length,
            searchTimestamp: new Date().toISOString()
        }, `Found ${busesWithJourneyDetails.length} buses traveling from ${fromStop} to ${toStop}`)
    );
});

// Utility function to get buses from one stop to another (for internal use)
export const getAvailableBusesFromStopToStop = async (fromStop, toStop) => {
    try {
        // Input validation
        if (!fromStop || !toStop || fromStop.toLowerCase().trim() === toStop.toLowerCase().trim()) {
            return [];
        }

        // Get all active buses
        const buses = await Bus.find({ isActive: true });

        // Filter buses that travel from fromStop to toStop
        const validBuses = buses.filter(bus => {
            // Check if the bus has a route with stops
            if (!bus.route || !bus.route.stops || bus.route.stops.length < 2) {
                return false;
            }

            // Find both stops in the route
            const fromStopDetails = bus.route.stops.find(stop => 
                stop.name && stop.name.toLowerCase().trim() === fromStop.toLowerCase().trim()
            );
            
            const toStopDetails = bus.route.stops.find(stop => 
                stop.name && stop.name.toLowerCase().trim() === toStop.toLowerCase().trim()
            );

            // Both stops must exist and fromStop must come before toStop
            return fromStopDetails && toStopDetails && fromStopDetails.order < toStopDetails.order;
        });

        return validBuses.map(bus => {
            const fromStopDetails = bus.route.stops.find(stop => 
                stop.name.toLowerCase().trim() === fromStop.toLowerCase().trim()
            );
            
            const toStopDetails = bus.route.stops.find(stop => 
                stop.name.toLowerCase().trim() === toStop.toLowerCase().trim()
            );

            const stopsInBetween = bus.route.stops.filter(stop => 
                stop.order > fromStopDetails.order && stop.order < toStopDetails.order
            ).sort((a, b) => a.order - b.order);

            return {
                busId: bus.busId,
                busNumber: bus.busNumber,
                routeName: bus.routeName,
                driverName: bus.driverName,
                capacity: bus.capacity,
                journeyDetails: {
                    fromStop: {
                        name: fromStopDetails.name,
                        latitude: fromStopDetails.latitude,
                        longitude: fromStopDetails.longitude,
                        order: fromStopDetails.order
                    },
                    toStop: {
                        name: toStopDetails.name,
                        latitude: toStopDetails.latitude,
                        longitude: toStopDetails.longitude,
                        order: toStopDetails.order
                    },
                    stopsInBetween: stopsInBetween,
                    totalStopsInJourney: toStopDetails.order - fromStopDetails.order
                },
                route: bus.route
            };
        });
    } catch (error) {
        console.error('Error getting buses from stop to stop:', error);
        return [];
    }
};

export  const MakeTheBusActive = asyncHandler(async (req, res) => {
    const { busId,secretKey } = req.body
    console.log(req.body);
    // Find the bus by ID and update its status
    const bus = await Bus.findOne({ busId });
    if (!bus) {
        return res.status(404).json({ message: "Bus not found" });
    }
  
    if (bus.secretKey !== secretKey) {
        return res.status(403).json({ message: "Invalid secret key" });
    }
    ///  i have to now user the redis for cache

    bus.isActive = true;
    await bus.save();

    //

    //  genrate the random token and store in the redis db
const token = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit OTP style

    const client = redisClient();
    await client.setEx(`busToken:${bus.busId}`, 3600, token); //  toke

    return res.status(200).json({ message: "Bus activated successfully" , token:token});
});

export {
    createBus,
    getAllBuses,
    getBusById,
    updateBus,
    deleteBus,
    getBusLocationHistory,
    getActiveBusesStatus,
    searchBuses,
    getBusesByBoardingStop,
    getBusesFromStopToStop
};


//