import { asyncHandler } from "../utils/asyncHandler.js";
import { Bus } from "../models/bus.models.js";
import { BusLocation } from "../models/busLocation.models.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getActiveBuses, isDriverOnline } from "../sockets_services/bus.sockets_services.js";
import { getBusPassengerCounts } from "../sockets_services/client.sockets_services.js";
import { redisClient } from "../db/redis.db.js";
import GeminiService from "../services/gemini.service.js";
import { Organization } from "../models/org.models.js";
import simplify from "simplify-js";
import Fuse from "fuse.js";

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
    const org = await Organization.findOne({ email: ownerEmail });
    if (!org) {
        throw new ApiError(404, "Organization not found");
    }

    const bus = await Bus.create({
        ownerOrg: org._id,
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
    const { query, latitude, longitude, radius = 5, translateHindi = true } = req.query;

    let searchFilter = { isActive: true };
    let translatedQuery = query;
    let translationInfo = null;

    // Enhanced search with Hindi translation support
    if (query) {
        try {
            // Check if translation is needed and enabled
            if (translateHindi && query.trim()) {
                // Use Gemini to translate Hindi city names to English
                const translationResult = await GeminiService.processSearchQuery(query.trim());
                translatedQuery = translationResult.translated;
                translationInfo = {
                    original: translationResult.original,
                    translated: translationResult.translated,
                    searchVariations: translationResult.searchVariations,
                    confidence: translationResult.confidence,
                    wasTranslated: translationResult.original !== translationResult.translated
                };

                // Build enhanced search filter with multiple variations
                const searchTerms = translationResult.searchVariations;
                const searchConditions = [];

                searchTerms.forEach(term => {
                    searchConditions.push(
                        { busNumber: { $regex: term, $options: 'i' } },
                        { routeName: { $regex: term, $options: 'i' } },
                        { driverName: { $regex: term, $options: 'i' } },
                        // Search in route stops
                        { 'route.stops.name': { $regex: term, $options: 'i' } },
                        { 'route.startPoint.name': { $regex: term, $options: 'i' } },
                        { 'route.endPoint.name': { $regex: term, $options: 'i' } }
                    );
                });

                searchFilter.$or = searchConditions;
            } else {
                // Standard search without translation
                searchFilter.$or = [
                    { busNumber: { $regex: query, $options: 'i' } },
                    { routeName: { $regex: query, $options: 'i' } },
                    { driverName: { $regex: query, $options: 'i' } },
                    { 'route.stops.name': { $regex: query, $options: 'i' } },
                    { 'route.startPoint.name': { $regex: query, $options: 'i' } },
                    { 'route.endPoint.name': { $regex: query, $options: 'i' } }
                ];
            }
        } catch (translationError) {
            console.warn('Translation failed, falling back to original search:', translationError);
            // Fallback to original search if translation fails
            searchFilter.$or = [
                { busNumber: { $regex: query, $options: 'i' } },
                { routeName: { $regex: query, $options: 'i' } },
                { driverName: { $regex: query, $options: 'i' } },
                { 'route.stops.name': { $regex: query, $options: 'i' } },
                { 'route.startPoint.name': { $regex: query, $options: 'i' } },
                { 'route.endPoint.name': { $regex: query, $options: 'i' } }
            ];
        }
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
                            lastUpdated: latestLocation.lastSeen,
                            isDriverOnline: await isDriverOnline(bus.busId)
                        };
                    }
                }
                return null;
            })
        );

        buses = busesWithDistance
            .filter(bus => bus !== null)
            .sort((a, b) => a.distance - b.distance);
    } else {
        // Add real-time status for non-location based search
        const activeBuses = await getActiveBuses();
        const passengerCounts = await getBusPassengerCounts();

        buses = buses.map(bus => {
            const isOnline = activeBuses.some(activeBus => activeBus.busId === bus.busId);
            return {
                ...bus.toObject(),
                isDriverOnline: isOnline,
                connectedPassengers: passengerCounts[bus.busId] || 0
            };
        });
    }

    // Enhanced response with translation info
    const response = {
        buses,
        searchInfo: {
            originalQuery: query || '',
            translatedQuery: translatedQuery || '',
            resultCount: buses.length,
            searchRadius: latitude && longitude ? `${radius} km` : null,
            translationInfo
        }
    };

    return res.status(200).json(
        new ApiResponse(200, response, `Found ${buses.length} buses` + (translationInfo?.wasTranslated ? ` (translated from "${translationInfo.original}")` : ''))
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

// Fuzzy search function for bus routes
const searchBusesWithFuzzyLogic = async (source, destination) => {
  try {
    console.log(`🔍 Fuzzy searching buses: "${source}" → "${destination}"`);

    // Fetch all active buses with populated route data
    const buses = await Bus.find().lean();
    
    if (!buses.length) {
      console.log("❌ No active buses found in database");
      return {
        success: false,
        message: "No active buses found in database",
        results: []
      };
    }

    console.log(`📊 Found ${buses.length} active buses in database`);
    
    // Debug: Log the first bus structure to understand data
    if (buses.length > 0) {
      console.log("🔍 Sample bus structure:", JSON.stringify(buses[0], null, 2));
      
      // Log all available stops for debugging
      console.log("📍 Available stops in database:");
      buses.forEach((bus, index) => {
        if (index < 3) { // Show first 3 buses only
          console.log(`  Bus ${bus.busNumber}:`);
          console.log(`    Start: ${bus.route?.startPoint?.name || 'N/A'}`);
          console.log(`    End: ${bus.route?.endPoint?.name || 'N/A'}`);
          if (bus.route?.stops && bus.route.stops.length > 0) {
            console.log(`    Stops: ${bus.route.stops.map(s => s.name).join(', ')}`);
          }
        }
      });
    }

    // Enhanced Fuse.js options for better fuzzy matching
    const fuseOptions = {
      includeScore: true,
      threshold: 0.3, // More lenient matching (0 = exact, 1 = match anything)
      ignoreLocation: true,
      findAllMatches: true,
      minMatchCharLength: 1,
      distance: 100, // How far to search
      keys: [
        // Search in route information with different weights
        { name: "route.startPoint.name", weight: 0.4 },
        { name: "route.endPoint.name", weight: 0.4 },
        { name: "route.stops.name", weight: 0.4 },
        { name: "routeName", weight: 0.3 },
        { name: "busNumber", weight: 0.1 },
        // Add enhanced searchable fields
        { name: "searchableRoute", weight: 0.5 },
        { name: "allStops", weight: 0.4 },
        { name: "startDestination", weight: 0.3 }
      ]
    };

    // Create enhanced search data with all possible text combinations
    const enhancedBuses = buses.map(bus => {
      const routeStops = bus.route?.stops || [];
      const startPoint = bus.route?.startPoint?.name || '';
      const endPoint = bus.route?.endPoint?.name || '';
      
      // Create comprehensive searchable text
      const allStopsText = routeStops.map(stop => stop.name || '').filter(Boolean).join(' ');
      const fullRouteText = [startPoint, ...routeStops.map(s => s.name), endPoint].filter(Boolean).join(' ');
      
      const enhanced = {
        ...bus,
        // Searchable combinations
        searchableRoute: fullRouteText.toLowerCase(),
        allStops: allStopsText.toLowerCase(),
        startDestination: `${startPoint} ${endPoint}`.toLowerCase(),
        // Individual fields for easier access
        startPointName: startPoint.toLowerCase(),
        endPointName: endPoint.toLowerCase(),
        stopNames: routeStops.map(stop => (stop.name || '').toLowerCase())
      };
      
      console.log(`🚌 Bus ${bus.busNumber}: Route = "${fullRouteText}"`);
      return enhanced;
    });

    // Multiple search strategies for better results
    const fuse = new Fuse(enhancedBuses, fuseOptions);
    
    console.log(`🎯 Searching for source: "${source}" and destination: "${destination}"`);
    
    // Strategy 1: Combined search
    const combinedQuery = `${source} ${destination}`.toLowerCase();
    console.log(`🔍 Combined search query: "${combinedQuery}"`);
    const combinedResults = fuse.search(combinedQuery);
    
    // Strategy 2: Individual searches
    const sourceQuery = source.toLowerCase();
    const destinationQuery = destination.toLowerCase();
    console.log(`🔍 Source query: "${sourceQuery}"`);
    console.log(`🔍 Destination query: "${destinationQuery}"`);
    
    const sourceResults = fuse.search(sourceQuery);
    const destinationResults = fuse.search(destinationQuery);
    
    console.log(`📊 Search results - Combined: ${combinedResults.length}, Source: ${sourceResults.length}, Dest: ${destinationResults.length}`);

    // Strategy 3: Manual string matching for fallback
    const manualMatches = enhancedBuses.filter(bus => {
      const routeText = bus.searchableRoute;
      const sourceMatch = routeText.includes(sourceQuery) || 
                         bus.stopNames.some(stop => stop.includes(sourceQuery) || sourceQuery.includes(stop));
      const destMatch = routeText.includes(destinationQuery) || 
                       bus.stopNames.some(stop => stop.includes(destinationQuery) || destinationQuery.includes(stop));
      
      const matches = sourceMatch && destMatch;
      if (matches) {
        console.log(`✅ Manual match found: Bus ${bus.busNumber} - Route: "${routeText}"`);
      }
      return matches;
    });

    console.log(`📊 Manual matches found: ${manualMatches.length}`);

    // Combine all results
    let allResults = [];
    
    // Add combined results
    allResults = allResults.concat(combinedResults.map(r => ({...r, matchType: 'combined'})));
    
    // Add intersection results (buses that match both source AND destination)
    const matchedBusIds = new Set();
    sourceResults.forEach(sResult => {
      destinationResults.forEach(dResult => {
        if (sResult.item._id.toString() === dResult.item._id.toString()) {
          const combinedScore = (sResult.score + dResult.score) / 2;
          
          if (!matchedBusIds.has(sResult.item._id.toString())) {
            allResults.push({
              item: sResult.item,
              score: combinedScore,
              matchType: 'intersection'
            });
            matchedBusIds.add(sResult.item._id.toString());
          }
        }
      });
    });

    // Add manual matches with high priority
    manualMatches.forEach(bus => {
      if (!matchedBusIds.has(bus._id.toString())) {
        allResults.push({
          item: bus,
          score: 0.1, // High priority score
          matchType: 'manual'
        });
        matchedBusIds.add(bus._id.toString());
      }
    });

    // Strategy 4: Route sequence matching (source appears before destination in route)
    const sequenceMatches = enhancedBuses.filter(bus => {
      const routeStops = [
        bus.startPointName,
        ...bus.stopNames,
        bus.endPointName
      ].filter(Boolean);

      const sourceIndex = routeStops.findIndex(stop => 
        stop.includes(sourceQuery) || sourceQuery.includes(stop)
      );
      
      const destIndex = routeStops.findIndex(stop => 
        stop.includes(destinationQuery) || destinationQuery.includes(stop)
      );

      const isSequence = sourceIndex !== -1 && destIndex !== -1 && sourceIndex < destIndex;
      if (isSequence) {
        console.log(`🎯 Sequence match: Bus ${bus.busNumber} - ${routeStops[sourceIndex]} → ${routeStops[destIndex]}`);
      }
      return isSequence;
    });

    // Add sequence matches
    sequenceMatches.forEach(bus => {
      if (!matchedBusIds.has(bus._id.toString())) {
        allResults.push({
          item: bus,
          score: 0.05, // Highest priority
          matchType: 'sequence'
        });
        matchedBusIds.add(bus._id.toString());
      }
    });

    // Remove duplicates and sort by score (lower = better)
    const uniqueResults = allResults
      .filter((result, index, array) => 
        array.findIndex(r => r.item._id.toString() === result.item._id.toString()) === index
      )
      .sort((a, b) => a.score - b.score)
      .slice(0, 10);

    console.log(`✅ Final results: ${uniqueResults.length} unique matches found`);

    if (!uniqueResults.length) {
      // Provide helpful feedback with actual available locations
      const allLocations = enhancedBuses.flatMap(bus => [
        bus.startPointName,
        bus.endPointName,
        ...bus.stopNames
      ]).filter(Boolean);

      const uniqueLocations = [...new Set(allLocations)];
      
      console.log(`💡 Available locations: ${uniqueLocations.slice(0, 10).join(', ')}`);
      
      return {
        success: false,
        message: "No matching bus routes found",
        debug: {
          searchedFor: { source, destination },
          availableLocations: uniqueLocations.slice(0, 20),
          totalBuses: buses.length,
          searchResults: {
            combined: combinedResults.length,
            source: sourceResults.length,
            destination: destinationResults.length,
            manual: manualMatches.length,
            sequence: sequenceMatches.length
          }
        },
        suggestions: {
          availableLocations: uniqueLocations.slice(0, 10),
          searchTips: [
            "Try using partial names (e.g., 'Sud' for 'Sudhowala')",
            "Check spelling of source and destination",
            "Make sure both locations are served by our bus network"
          ]
        },
        results: []
      };
    }

    // Convert fuzzy results to bus journey format
    const validBuses = uniqueResults.map(result => {
      const bus = result.item;
      
      // Find matching stops for journey details
      const findBestStopMatch = (stopName) => {
        const query = stopName.toLowerCase();
        
        // Check startPoint
        if (bus.route?.startPoint?.name) {
          const startPointName = bus.route.startPoint.name.toLowerCase();
          if (startPointName.includes(query) || query.includes(startPointName)) {
            return { ...bus.route.startPoint, order: 0, type: 'startPoint' };
          }
        }
        
        // Check endPoint
        if (bus.route?.endPoint?.name) {
          const endPointName = bus.route.endPoint.name.toLowerCase();
          if (endPointName.includes(query) || query.includes(endPointName)) {
            return { ...bus.route.endPoint, order: 999999, type: 'endPoint' };
          }
        }
        
        // Check stops
        if (bus.route?.stops) {
          const matchingStop = bus.route.stops.find(stop => 
            stop.name && (stop.name.toLowerCase().includes(query) || query.includes(stop.name.toLowerCase()))
          );
          if (matchingStop) {
            return { ...matchingStop, type: 'stop' };
          }
        }
        
        return null;
      };

      const fromStopDetails = findBestStopMatch(source);
      const toStopDetails = findBestStopMatch(destination);

      // Calculate journey details if both stops found
      let stopsInBetween = [];
      let totalStopsInJourney = 0;

      if (fromStopDetails && toStopDetails && fromStopDetails.order < toStopDetails.order) {
        if (bus.route?.stops) {
          stopsInBetween = bus.route.stops.filter(stop => 
            stop.order > fromStopDetails.order && stop.order < toStopDetails.order
          ).sort((a, b) => a.order - b.order);
        }
        totalStopsInJourney = toStopDetails.order - fromStopDetails.order;
      }

      return {
        ...bus,
        fuzzyMatch: {
          score: result.score,
          matchType: result.matchType
        },
        journeyDetails: {
          fromStop: fromStopDetails,
          toStop: toStopDetails,
          stopsInBetween,
          totalStopsInJourney,
          estimatedJourneyTime: `${Math.max(totalStopsInJourney * 15, 15)} minutes`
        }
      };
    });

    console.log(`✅ Processed ${validBuses.length} valid buses with journey details`);

    return {
      success: true,
      message: `Found ${validBuses.length} matching buses`,
      results: validBuses,
      debug: {
        searchedFor: { source, destination },
        totalBuses: buses.length,
        fuzzyResults: uniqueResults.length,
        strategies: {
          combined: combinedResults.length,
          intersection: matchedBusIds.size,
          manual: manualMatches.length,
          sequence: sequenceMatches.length
        }
      }
    };

  } catch (error) {
    console.error('❌ Error in fuzzy bus search:', error);
    return {
      success: false,
      message: "Error performing fuzzy search",
      error: error.message,
      results: []
    };
  }
};

// 🚌 Find buses that travel from one stop to another (WITH FUZZY SEARCH)
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

    console.log(`🔍 Searching buses from "${fromStop}" to "${toStop}" using FUZZY search`);

    // Use fuzzy search logic
    const fuzzySearchResult = await searchBusesWithFuzzyLogic(fromStop, toStop);

    if (!fuzzySearchResult.success) {
        return res.status(404).json(
            new ApiResponse(404, {
                fromStop,
                toStop,
                availableBuses: [],
                totalBuses: 0,
                searchTimestamp: new Date().toISOString(),
                debug: fuzzySearchResult.debug,
                suggestions: fuzzySearchResult.suggestions
            }, fuzzySearchResult.message)
        );
    }

    let busesWithJourneyDetails = fuzzySearchResult.results;

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
            fromStop,
            toStop,
            searchMethod: "fuzzy",
            availableBuses: busesWithJourneyDetails,
            totalBuses: busesWithJourneyDetails.length,
            searchTimestamp: new Date().toISOString(),
            debug: fuzzySearchResult.debug
        }, `Found ${busesWithJourneyDetails.length} buses using fuzzy search`)
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
        const buses = await Bus.find();

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
    const bus = await Bus.findOne({busId: busId });
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

    try {
        const client = redisClient();
        // Ensure client is connected before using
        if (!client.isOpen) {
            await client.connect();
        }
        await client.setEx(`busToken:${bus.busId}`, 3600, token); //  token expires in 1 hour
        console.log(`✅ Token stored in Redis for bus ${bus.busId}`);
    } catch (error) {
        console.error('❌ Error storing token in Redis:', error);
        throw new ApiError(500, "Failed to store authentication token");
    }

    return res.status(200).json({ message: "Bus activated successfully" , token:token,busInfo:bus});
});

export const makeTheBusRoute = asyncHandler(async (req, res) => {
    const { busId, routeCoordinates } = req.body;

     console.log(`the busId is  `,busId)

    if (!routeCoordinates || routeCoordinates.length === 0) {
        return res.status(400).json({ message: "routeCoordinates are required" });
    }
    if (!busId ) {
        return res.status(400).json({ message: "busId is required" });
    }

    // Convert to format for simplify-js: {x: lng, y: lat}
    const points = routeCoordinates.map(coord => ({
        x: coord.lng,
        y: coord.lat,
        timestamp: coord.time ? new Date(coord.time) : new Date(),
        accuracy: coord.accuracy
    }));
    const bus = await Bus.findOne({ busId: busId });
    if (!bus) {
        console.log('bus not found');
        return res.status(404).json({ message: "Bus not found" });
    }


    // Perform Douglas-Peucker simplification
    // tolerance can be adjusted (in coordinate units, roughly ~0.00001 ~ 1m)
    const tolerance = 0.00001; // adjust as needed
    const highQuality = true; // preserves important points
    const simplifiedPoints = simplify(points, tolerance, highQuality);
    const simplifiedArr = simplifiedPoints.map(p => [p.y, p.x]); // [lat, lng]
    console.log("Simplified route coordinates:", simplifiedArr);
    // console the actual number of points reduced

    console.log("Original points:", points.length, "Simplified points:", simplifiedPoints.length);

    // Find the bus by busId
    

    // Update only the routeCoordinates in the DB
    bus.route.routeCoordinates = simplifiedPoints.map(coord => ({
        latitude: coord.y,
        longitude: coord.x,
        timestamp: coord.timestamp,
        accuracy: coord.accuracy
    }));

    await bus.save();

    return res.status(200).json({
        message: `Bus route coordinates updated successfully for BUS111`,
        routeCoordinates: bus.route.routeCoordinates
    });
});

export  const updatePaassenger = asyncHandler(async (req, res) => {
    const { busId, passengerCount } = req.body;

    if (!busId || passengerCount === undefined) {
        return res.status(400).json({ message: "busId and passengerCount are required" });
    }

    const bus = await Bus.findOne({ busId: busId });
    if (!bus) {
        return res.status(404).json({ message: "Bus not found" });
    }

    bus.capacity= passengerCount;
    await bus.save();

    return res.status(200).json({ message: "Passenger count updated successfully", bus });
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
    getBusesFromStopToStop,
   
    
};


//