import express from 'express';
import GeminiService from '../services/gemini.service.js';

const router = express.Router();

// Test endpoint to demonstrate Hindi city translation
router.get('/test-translation', async (req, res) => {
    const testCities = [
        'मुंबई',
        'दिल्ली', 
        'बंगलौर',
        'चेन्नै',
        'कोलकाता',
        'हैदराबाद',
        'पुणे',
        'अहमदाबाद',
        'जयपुर',
        'लखनऊ',
        'Mumbai', // Already in English
        'Delhi', // Already in English
        'गुड़गांव', // Gurgaon/Gurugram
        'नोएडा', // Noida
        'फरीदाबाद', // Faridabad
        'भोपाल',
        'इंदौर',
        'नागपुर'
    ];

    try {
        const translationPromises = testCities.map(async (city) => {
            const result = await GeminiService.processSearchQuery(city);
            return {
                original: city,
                translated: result.translated,
                confidence: result.confidence,
                wasTranslated: result.original !== result.translated,
                searchVariations: result.searchVariations
            };
        });

        const results = await Promise.all(translationPromises);

        res.json({
            success: true,
            message: 'City translation test completed',
            data: {
                totalCities: testCities.length,
                results: results,
                summary: {
                    translated: results.filter(r => r.wasTranslated).length,
                    alreadyEnglish: results.filter(r => !r.wasTranslated).length,
                    highConfidence: results.filter(r => r.confidence === 'high').length,
                    mediumConfidence: results.filter(r => r.confidence === 'medium').length,
                    lowConfidence: results.filter(r => r.confidence === 'low').length
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Translation test failed',
            error: error.message
        });
    }
});

// Live translation demo endpoint
router.post('/demo-translate', async (req, res) => {
    const { cityName } = req.body;
    
    if (!cityName) {
        return res.status(400).json({
            success: false,
            message: 'cityName is required'
        });
    }

    try {
        console.log(`🔄 Translating city: "${cityName}"`);
        const startTime = Date.now();
        
        const result = await GeminiService.processSearchQuery(cityName);
        
        const endTime = Date.now();
        const processingTime = endTime - startTime;

        console.log(`✅ Translation completed in ${processingTime}ms: "${cityName}" → "${result.translated}"`);

        res.json({
            success: true,
            message: 'City translated successfully',
            data: {
                input: cityName,
                output: result.translated,
                processingTime: `${processingTime}ms`,
                confidence: result.confidence,
                wasTranslated: result.original !== result.translated,
                searchVariations: result.searchVariations,
                recommendedForSearch: result.translated
            }
        });
    } catch (error) {
        console.error(`❌ Translation failed for "${cityName}":`, error);
        res.status(500).json({
            success: false,
            message: 'Translation failed',
            error: error.message,
            fallback: cityName // Return original if translation fails
        });
    }
});

export default router;