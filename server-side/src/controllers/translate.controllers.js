import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import GeminiService from "../services/gemini.service.js";

/**
 * Translate Hindi city name to English
 * @route POST /api/translate/city
 */
const translateCityName = asyncHandler(async (req, res) => {
    const { cityName } = req.body;

    if (!cityName || typeof cityName !== 'string') {
        throw new ApiError(400, "City name is required and must be a string");
    }

    if (cityName.trim().length === 0) {
        throw new ApiError(400, "City name cannot be empty");
    }

    if (cityName.length > 100) {
        throw new ApiError(400, "City name is too long (max 100 characters)");
    }

    try {
        // Check if service is available
        if (!GeminiService.isServiceAvailable()) {
            return res.status(503).json(
                new ApiResponse(503, {
                    original: cityName.trim(),
                    translated: cityName.trim(),
                    searchVariations: [cityName.trim()],
                    confidence: 'unavailable',
                    serviceAvailable: false
                }, "Translation service is currently unavailable. Returning original city name.")
            );
        }

        const result = await GeminiService.processSearchQuery(cityName.trim());
        
        return res.status(200).json(
            new ApiResponse(200, result, "City name translated successfully")
        );
    } catch (error) {
        console.error('Translation error:', error);
        throw new ApiError(500, "Failed to translate city name. Please try again.");
    }
});

/**
 * Batch translate multiple city names
 * @route POST /api/translate/cities/batch
 */
const batchTranslateCityNames = asyncHandler(async (req, res) => {
    const { cityNames } = req.body;

    if (!Array.isArray(cityNames)) {
        throw new ApiError(400, "cityNames must be an array");
    }

    if (cityNames.length === 0) {
        throw new ApiError(400, "cityNames array cannot be empty");
    }

    if (cityNames.length > 20) {
        throw new ApiError(400, "Maximum 20 city names allowed per batch");
    }

    // Validate each city name
    for (const cityName of cityNames) {
        if (!cityName || typeof cityName !== 'string' || cityName.trim().length === 0) {
            throw new ApiError(400, "All city names must be non-empty strings");
        }
        if (cityName.length > 100) {
            throw new ApiError(400, "City name is too long (max 100 characters)");
        }
    }

    try {
        const translations = await GeminiService.batchTranslateCityNames(
            cityNames.map(name => name.trim())
        );
        
        return res.status(200).json(
            new ApiResponse(200, translations, "City names translated successfully")
        );
    } catch (error) {
        console.error('Batch translation error:', error);
        throw new ApiError(500, "Failed to translate city names. Please try again.");
    }
});

/**
 * Get translation suggestions for search optimization
 * @route POST /api/translate/city/suggest
 */
const getCitySearchSuggestions = asyncHandler(async (req, res) => {
    const { cityName } = req.body;

    if (!cityName || typeof cityName !== 'string') {
        throw new ApiError(400, "City name is required and must be a string");
    }

    if (cityName.trim().length === 0) {
        throw new ApiError(400, "City name cannot be empty");
    }

    try {
        const result = await GeminiService.processSearchQuery(cityName.trim());
        
        // Add additional search optimizations
        const optimizedResult = {
            ...result,
            recommendedSearchTerm: result.translated,
            alternativeTerms: result.searchVariations,
            isTranslationNeeded: result.original !== result.translated,
            searchScore: result.confidence === 'high' ? 0.9 : (result.confidence === 'medium' ? 0.7 : 0.5)
        };
        
        return res.status(200).json(
            new ApiResponse(200, optimizedResult, "Search suggestions generated successfully")
        );
    } catch (error) {
        console.error('Search suggestion error:', error);
        throw new ApiError(500, "Failed to generate search suggestions. Please try again.");
    }
});

/**
 * Health check for Gemini API
 * @route GET /api/translate/health
 */
const checkTranslationHealth = asyncHandler(async (req, res) => {
    try {
        // Check if service is available first
        if (!GeminiService.isServiceAvailable()) {
            return res.status(503).json(
                new ApiResponse(503, {
                    status: 'unavailable',
                    testResult: null,
                    timestamp: new Date().toISOString(),
                    geminiApiAvailable: false,
                    reason: 'GEMINI_API_KEY not configured'
                }, "Translation service is not available - API key not configured")
            );
        }

        // Test with a simple known city name
        const testResult = await GeminiService.translateCityNameToEnglish("दिल्ली");
        
        const isHealthy = testResult && (testResult.toLowerCase().includes('delhi') || testResult === 'दिल्ली');
        
        return res.status(200).json(
            new ApiResponse(200, {
                status: isHealthy ? 'healthy' : 'degraded',
                testResult: testResult,
                timestamp: new Date().toISOString(),
                geminiApiAvailable: true
            }, isHealthy ? "Translation service is healthy" : "Translation service is degraded")
        );
    } catch (error) {
        console.error('Health check error:', error);
        return res.status(503).json(
            new ApiResponse(503, {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString(),
                geminiApiAvailable: false
            }, "Translation service is not available")
        );
    }
});

/**
 * General Gemini AI Chat endpoint
 * @route POST /api/translate/chat
 */
const chatWithGemini = asyncHandler(async (req, res) => {
    const { message, userId } = req.body;

    if (!message || typeof message !== 'string') {
        throw new ApiError(400, "Message is required and must be a string");
    }

    if (message.trim().length === 0) {
        throw new ApiError(400, "Message cannot be empty");
    }

    if (message.length > 2000) {
        throw new ApiError(400, "Message is too long (max 2000 characters)");
    }

    try {
        const response = await GeminiService.getGeminiResponse(message.trim(), userId);
        
        return res.status(200).json(
            new ApiResponse(200, {
                userMessage: message.trim(),
                geminiResponse: response,
                userId: userId || 'anonymous',
                timestamp: new Date().toISOString()
            }, "Chat response generated successfully")
        );
    } catch (error) {
        console.error('Chat error:', error);
        throw new ApiError(500, "Failed to get chat response. Please try again.");
    }
});

export {
    translateCityName,
    batchTranslateCityNames,
    getCitySearchSuggestions,
    checkTranslationHealth,
    chatWithGemini
};