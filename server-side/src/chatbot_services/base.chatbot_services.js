import { transcribeAudio } from "./transcript.chatbot_services.js";
import { processVoiceForDestinations } from "./destination.extractor.js";
import Fuse from "fuse.js";
import { Bus } from "../models/bus.models.js";

/**
 * Advanced fuzzy bus search function
 */
const searchBusesWithFuzzyLogic = async (source, destination) => {
  try {
    console.log(`🔍 Fuzzy searching buses: "${source}" → "${destination}"`);

    // Fetch all active buses with populated route data
    const buses = await Bus.find({ isActive: true }).lean();
    
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
    }

    // Enhanced Fuse.js options for better fuzzy matching
    const fuseOptions = {
      includeScore: true,
      threshold: 0.8, // More lenient matching (0 = exact, 1 = match anything)
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

    // Format results with detailed information
    const formattedResults = uniqueResults.map(result => {
      const bus = result.item;
      const routeStops = [
        bus.startPointName,
        ...bus.stopNames,
        bus.endPointName
      ].filter(Boolean);

      return {
        busId: bus.busId,
        busNumber: bus.busNumber,
        routeName: bus.routeName,
        driverName: bus.driverName,
        driverPhone: bus.driverPhone,
        capacity: bus.capacity,
        isActive: bus.isActive,
        route: {
          startPoint: bus.route?.startPoint,
          endPoint: bus.route?.endPoint,
          stops: bus.route?.stops || [],
          fullRoute: routeStops
        },
        matchScore: result.score,
        matchType: result.matchType,
        matchQuality: result.score < 0.2 ? 'excellent' : 
                     result.score < 0.4 ? 'good' : 
                     result.score < 0.6 ? 'fair' : 'poor'
      };
    });

    return {
      success: true,
      count: formattedResults.length,
      results: formattedResults,
      message: `Found ${formattedResults.length} matching bus route(s)`
    };

  } catch (error) {
    console.error("❌ Fuzzy search error:", error);
    return {
      success: false,
      message: "Error during bus search",
      error: error.message,
      results: []
    };
  }
};

export const processAudio = async (req, res) => {
  console.log("🎵 Audio transcription endpoint hit");
  console.log("Request file:", req.file);

  try {
    // 1. Validate file presence
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No audio file uploaded",
        message: "Please upload an audio file",
      });
    }

    console.log("📁 File details:", {
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
    });

    // 2. Call ElevenLabs utils to transcribe
    console.log("🎤 Step 1: Transcribing audio...");
    const transcription = await transcribeAudio(req.file.path);
    const transcribedText = transcription.text;
    const detectedLanguage = transcription.language;

    console.log(`🎯 Transcribed (${detectedLanguage}): "${transcribedText}"`);

    // 3. Extract source and destination using Gemini AI
    console.log("🗺️ Step 2: Extracting destinations...");
    const destinationResult = await processVoiceForDestinations(transcribedText, detectedLanguage);

    console.log(`📍 Extracted: ${destinationResult.source} → ${destinationResult.destination}`);

    // 4. Search for buses if valid route is found
    let busSearchResult = null;
    if (destinationResult.isValidRoute && 
        destinationResult.source !== "Current Location" && 
        destinationResult.source !== "Unknown" &&
        destinationResult.destination !== "Unknown") {
      
      console.log("🚌 Step 3: Searching for matching buses...");
      busSearchResult = await searchBusesWithFuzzyLogic(
        destinationResult.source, 
        destinationResult.destination
      );
      
      console.log(`🔍 Bus search completed: ${busSearchResult.success ? `${busSearchResult.count} buses found` : 'No buses found'}`);
    } else {
      console.log("⏭️ Skipping bus search - invalid or incomplete route");
    }

    // 5. Return comprehensive response with transcription, destinations, and buses
    const response = {
      success: true,
      data: {
        transcription: {
          text: transcribedText,
          language: detectedLanguage,
          model: "ElevenLabs scribe_v1"
        },
        destinations: {
          source: destinationResult.source,
          destination: destinationResult.destination,
          isValidRoute: destinationResult.isValidRoute
        },
        processing: {
          originalText: transcribedText,
          extractionSuccess: destinationResult.success,
          readyForBusSearch: destinationResult.isValidRoute
        }
      }
    };

    // Add bus search results if available
    if (busSearchResult) {
      response.data.busSearch = {
        success: busSearchResult.success,
        count: busSearchResult.count || 0,
        results: busSearchResult.results || [],
        message: busSearchResult.message,
        suggestions: busSearchResult.suggestions || null
      };

      // Update main message based on bus search results
      if (busSearchResult.success && busSearchResult.count > 0) {
        response.message = `🎯 Found ${busSearchResult.count} bus(es) for route: ${destinationResult.source} → ${destinationResult.destination}`;
      } else {
        response.message = `🔍 Route extracted (${destinationResult.source} → ${destinationResult.destination}) but no matching buses found`;
      }
    } else {
      response.message = destinationResult.isValidRoute ? 
        `Route extracted: ${destinationResult.source} → ${destinationResult.destination}` :
        "Transcription successful, but route unclear. Please specify source and destination.";
    }

    res.json(response);

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: err.message,
    });
  }
};
