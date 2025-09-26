import { transcribeAudio } from "./transcript.chatbot_services.js";
import { processVoiceForDestinations } from "./destination.extractor.js";
import Fuse from "fuse.js";
import { Bus } from "../models/bus.models.js";

/**
 * Advanced fuzzy bus search function
 */
const searchBusesWithFuzzyLogic = async (source, destination) => {
  try {
    console.log(`🔍 Fuzzy searching buses: ${source} → ${destination}`);

    // Fetch all active buses
    const buses = await Bus.find({ isActive: true });
    
    if (!buses.length) {
      return {
        success: false,
        message: "No active buses found in database",
        results: []
      };
    }

    console.log(`📊 Found ${buses.length} active buses in database`);

    // Enhanced Fuse.js options for better fuzzy matching
    const fuseOptions = {
      includeScore: true,
      threshold: 0.6, // 0 = exact match, 1 = match anything
      ignoreLocation: true,
      findAllMatches: true,
      minMatchCharLength: 2,
      keys: [
        // Search in route information with different weights
        { name: "route.startPoint.name", weight: 0.4 },
        { name: "route.endPoint.name", weight: 0.4 },
        { name: "route.stops.name", weight: 0.3 },
        { name: "routeName", weight: 0.2 },
        { name: "busNumber", weight: 0.1 }
      ]
    };

    // Create search strings for better matching
    const enhancedBuses = buses.map(bus => ({
      ...bus.toObject(),
      // Create searchable text combinations
      startDestination: `${bus.route?.startPoint?.name || ''} ${bus.route?.endPoint?.name || ''}`,
      allStops: bus.route?.stops?.map(stop => stop.name).join(' ') || '',
      fullRoute: `${bus.route?.startPoint?.name || ''} ${bus.route?.stops?.map(stop => stop.name).join(' ') || ''} ${bus.route?.endPoint?.name || ''}`
    }));

    // Add combined search fields to fuse options
    fuseOptions.keys.push(
      { name: "startDestination", weight: 0.5 },
      { name: "allStops", weight: 0.3 },
      { name: "fullRoute", weight: 0.4 }
    );

    const fuse = new Fuse(enhancedBuses, fuseOptions);

    // Search for routes that match both source and destination
    const combinedQuery = `${source} ${destination}`;
    console.log(`🎯 Searching for: "${combinedQuery}"`);

    // Multi-strategy search approach
    let results = [];

    // Strategy 1: Combined source + destination search
    const combinedResults = fuse.search(combinedQuery);
    results = results.concat(combinedResults);

    // Strategy 2: Individual source and destination searches
    const sourceResults = fuse.search(source);
    const destinationResults = fuse.search(destination);

    // Find buses that appear in both source and destination results
    const matchedBusIds = new Set();
    sourceResults.forEach(sResult => {
      destinationResults.forEach(dResult => {
        if (sResult.item._id.toString() === dResult.item._id.toString()) {
          // Calculate combined score (lower is better)
          const combinedScore = (sResult.score + dResult.score) / 2;
          
          if (!matchedBusIds.has(sResult.item._id.toString())) {
            results.push({
              item: sResult.item,
              score: combinedScore,
              matchType: 'source+destination'
            });
            matchedBusIds.add(sResult.item._id.toString());
          }
        }
      });
    });

    // Strategy 3: Route sequence matching (source appears before destination)
    const sequenceMatches = enhancedBuses.filter(bus => {
      const routeStops = [
        bus.route?.startPoint?.name,
        ...(bus.route?.stops?.map(stop => stop.name) || []),
        bus.route?.endPoint?.name
      ].filter(Boolean);

      const sourceIndex = routeStops.findIndex(stop => 
        stop.toLowerCase().includes(source.toLowerCase()) || 
        source.toLowerCase().includes(stop.toLowerCase())
      );
      
      const destIndex = routeStops.findIndex(stop => 
        stop.toLowerCase().includes(destination.toLowerCase()) || 
        destination.toLowerCase().includes(stop.toLowerCase())
      );

      return sourceIndex !== -1 && destIndex !== -1 && sourceIndex < destIndex;
    });

    // Add sequence matches with high priority (low score)
    sequenceMatches.forEach(bus => {
      if (!matchedBusIds.has(bus._id.toString())) {
        results.push({
          item: bus,
          score: 0.1, // Very good match
          matchType: 'sequence'
        });
        matchedBusIds.add(bus._id.toString());
      }
    });

    // Remove duplicates and sort by score (lower = better)
    const uniqueResults = results
      .filter((result, index, array) => 
        array.findIndex(r => r.item._id.toString() === result.item._id.toString()) === index
      )
      .sort((a, b) => a.score - b.score)
      .slice(0, 10); // Limit to top 10 results

    console.log(`✅ Found ${uniqueResults.length} matching buses`);

    if (!uniqueResults.length) {
      // Provide helpful feedback
      const allLocations = buses.flatMap(bus => [
        bus.route?.startPoint?.name,
        bus.route?.endPoint?.name,
        ...(bus.route?.stops?.map(stop => stop.name) || [])
      ]).filter(Boolean);

      const uniqueLocations = [...new Set(allLocations)];
      
      return {
        success: false,
        message: "No matching bus routes found",
        suggestions: {
          availableLocations: uniqueLocations.slice(0, 10),
          searchTips: [
            "Try using partial city names (e.g., 'Del' for 'Delhi')",
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
        bus.route?.startPoint?.name,
        ...(bus.route?.stops?.map(stop => stop.name) || []),
        bus.route?.endPoint?.name
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
        matchQuality: result.score < 0.3 ? 'excellent' : 
                     result.score < 0.5 ? 'good' : 
                     result.score < 0.7 ? 'fair' : 'poor'
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
