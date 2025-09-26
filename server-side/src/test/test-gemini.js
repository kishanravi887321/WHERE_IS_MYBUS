import GeminiService from '../services/gemini.service.js';

// Test script for Gemini API functionality
async function testGeminiAPI() {
    console.log('🧪 Testing Gemini API Integration...\n');

    // Test 1: Service availability
    console.log('Test 1: Service Availability');
    console.log('Service Available:', GeminiService.isServiceAvailable());
    console.log('');

    if (!GeminiService.isServiceAvailable()) {
        console.log('❌ Service not available. Please check your API key.');
        return;
    }

    // Test 2: Hindi city translation
    console.log('Test 2: Hindi City Translation');
    const hindiCities = ['मुंबई', 'दिल्ली', 'बंगलौर', 'Chennai', 'पुणे'];
    
    for (const city of hindiCities) {
        try {
            const startTime = Date.now();
            const translated = await GeminiService.translateCityNameToEnglish(city);
            const endTime = Date.now();
            console.log(`  ${city} → ${translated} (${endTime - startTime}ms)`);
        } catch (error) {
            console.log(`  ${city} → ERROR: ${error.message}`);
        }
    }
    console.log('');

    // Test 3: General chat
    console.log('Test 3: General Chat');
    const chatQuestions = [
        'What is the capital of India?',
        'Tell me about Indian transportation',
        'How do buses work in tier-2 cities?'
    ];

    for (const question of chatQuestions) {
        try {
            const startTime = Date.now();
            const response = await GeminiService.getGeminiResponse(question, 'test_user');
            const endTime = Date.now();
            console.log(`  Q: ${question}`);
            console.log(`  A: ${response.substring(0, 100)}...`);
            console.log(`  Time: ${endTime - startTime}ms\n`);
        } catch (error) {
            console.log(`  Q: ${question}`);
            console.log(`  A: ERROR - ${error.message}\n`);
        }
    }

    // Test 4: Search query processing
    console.log('Test 4: Search Query Processing');
    const searchQueries = ['मुंबई', 'delhi airport', 'गुड़गांव'];
    
    for (const query of searchQueries) {
        try {
            const result = await GeminiService.processSearchQuery(query);
            console.log(`  Query: ${query}`);
            console.log(`  Translated: ${result.translated}`);
            console.log(`  Confidence: ${result.confidence}`);
            console.log(`  Variations: ${result.searchVariations.join(', ')}\n`);
        } catch (error) {
            console.log(`  Query: ${query} → ERROR: ${error.message}\n`);
        }
    }

    console.log('✅ Gemini API Test Complete!');
}

// Run the test
testGeminiAPI().catch(console.error);