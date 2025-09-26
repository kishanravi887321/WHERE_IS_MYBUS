// Direct REST API approach for Gemini AI
// Using fetch instead of Google AI SDK to avoid model access issues

class GeminiService {
    constructor() {
        // Use the API key from environment or fallback to hardcoded one
        this.apiKey = process.env.GEMINI_API_KEY || "AIzaSyBAiR-zIIzaAVgP_EwVaY-XMx3LBEI7uaY";
        
        // Check if API key exists
        if (!this.apiKey) {
            console.warn('⚠️ GEMINI_API_KEY not found in environment variables. Translation services will be disabled.');
            this.isEnabled = false;
            return;
        }
        
        // Use direct REST API instead of SDK to avoid model access issues
        this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`;
        this.isEnabled = true;
        console.log('✅ Gemini AI service initialized successfully with REST API');
    }

    /**
     * Check if the service is available
     * @returns {boolean}
     */
    isServiceAvailable() {
        return this.isEnabled === true;
    }

    /**
     * Enhanced function for intelligent interaction with GEMINI_API
     * @param {string} userInput - User's input text
     * @param {string} userId - Optional user ID for session management
     * @returns {Promise<string>} - Gemini's response
     */
    async getGeminiResponse(userInput, userId = null) {
        if (!userId) {
            userId = `anonymous_${Date.now()}`; // Generate temp ID for anonymous users
        }
        
        console.log("User Input:", userInput, "User ID:", userId, "API Key Available:", !!this.apiKey);
        
        if (!this.isServiceAvailable()) {
            console.log('🔄 Gemini service not available, returning fallback response');
            return "Sorry, I'm currently unable to process your request. Please try again later.";
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: userInput
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Gemini API Error:', response.status, errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                console.error('Invalid response format:', data);
                throw new Error('Invalid response format from Gemini API');
            }

            const geminiResponse = data.candidates[0].content.parts[0].text.trim();
            console.log(`✅ Gemini Response for user ${userId}:`, geminiResponse.substring(0, 100) + "...");
            
            return geminiResponse;

        } catch (error) {
            console.error('Error getting Gemini response:', error);
            return "I'm having trouble processing your request right now. Please try again later.";
        }
    }

    /**
     * Convert Hindi city names to English with advanced prompt for accurate translation
     * @param {string} hindiCityName - City name in Hindi or mixed script
     * @returns {Promise<string>} - English city name
     */
    async translateCityNameToEnglish(hindiCityName) {
        // If service is not available, return original name
        if (!this.isServiceAvailable()) {
            console.log('🔄 Gemini service not available, returning original city name:', hindiCityName);
            return hindiCityName;
        }

        try {
            const prompt = `
You are an expert Indian geography and linguistics AI. Your task is to convert Hindi/Devanagari city names into their exact English equivalents as they appear in official Indian databases, maps, and transportation systems.

IMPORTANT RULES:
1. Return ONLY the exact English city name, no explanations or additional text
2. Use the official English spelling as used in Indian Railways, Google Maps, and government databases
3. For major cities, use the most commonly recognized English name
4. If the input is already in English, return it as-is (but correct any obvious spelling mistakes)
5. For ambiguous names, prefer the most populous/well-known city
6. Remove any extra words like "shahar", "nagar", "city" unless they are part of the official name

EXAMPLES:
- मुंबई → Mumbai
- दिल्ली → Delhi
- बंगलौर → Bengaluru
- चेन्नै → Chennai
- कोलकाता → Kolkata
- हैदराबाद → Hyderabad
- पुणे → Pune
- अहमदाबाद → Ahmedabad
- जयपुर → Jaipur
- लखनऊ → Lucknow
- कानपुर → Kanpur
- नागपुर → Nagpur
- इंदौर → Indore
- भोपाल → Bhopal
- विशाखापत्तनम → Visakhapatnam
- पटना → Patna
- वडोदरा → Vadodara
- लुधिआना → Ludhiana
- आगरा → Agra
- नाशिक → Nashik
- राजकोट → Rajkot
- मेरठ → Meerut

INPUT CITY NAME: "${hindiCityName}"

OUTPUT (English city name only):`;

            // Make direct REST API call to Gemini
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        topK: 1,
                        topP: 0.1,
                        maxOutputTokens: 50,
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Gemini API Error:', response.status, errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                console.error('Invalid response format:', data);
                throw new Error('Invalid response format from Gemini API');
            }

            let translatedName = data.candidates[0].content.parts[0].text.trim();
            
            // Clean up the response - remove any extra formatting or explanations
            translatedName = translatedName
                .replace(/['"]/g, '') // Remove quotes
                .replace(/\n.*$/g, '') // Remove everything after first line
                .replace(/^.*?:/, '') // Remove any prefix with colon
                .trim();

            // Validation: Ensure we got a valid city name
            if (!translatedName || translatedName.length > 50) {
                console.warn(`Invalid translation received for "${hindiCityName}": "${translatedName}"`);
                return hindiCityName; // Return original if translation seems invalid
            }

            console.log(`✅ Translated: "${hindiCityName}" → "${translatedName}"`);
            return translatedName;

        } catch (error) {
            console.error('Error translating city name with Gemini:', error);
            console.log('🔄 Translation failed, returning original city name:', hindiCityName);
            return hindiCityName; // Return original name as fallback
        }
    }

    /**
     * Batch translate multiple city names
     * @param {string[]} cityNames - Array of city names in Hindi/mixed script
     * @returns {Promise<Object>} - Object mapping original names to English names
     */
    async batchTranslateCityNames(cityNames) {
        const translations = {};
        
        // If service is not available, return original names
        if (!this.isServiceAvailable()) {
            console.log('🔄 Gemini service not available, returning original city names');
            cityNames.forEach(cityName => {
                translations[cityName] = cityName;
            });
            return translations;
        }
        
        // Process cities in parallel with rate limiting
        const batchSize = 5; // Limit concurrent requests
        for (let i = 0; i < cityNames.length; i += batchSize) {
            const batch = cityNames.slice(i, i + batchSize);
            const batchPromises = batch.map(async (cityName) => {
                try {
                    const translatedName = await this.translateCityNameToEnglish(cityName);
                    return { original: cityName, translated: translatedName };
                } catch (error) {
                    console.error(`Failed to translate ${cityName}:`, error);
                    return { original: cityName, translated: cityName }; // Return original on error
                }
            });

            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach(result => {
                translations[result.original] = result.translated;
            });

            // Add small delay between batches to respect rate limits
            if (i + batchSize < cityNames.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return translations;
    }

    /**
     * Smart city name processing - handles mixed English/Hindi and suggests alternatives
     * @param {string} cityName - Input city name
     * @returns {Promise<Object>} - Object with translated name and search suggestions
     */
    async processSearchQuery(cityName) {
        // If service is not available, return basic processing
        if (!this.isServiceAvailable()) {
            console.log('🔄 Gemini service not available, providing basic search processing');
            return {
                original: cityName,
                translated: cityName,
                searchVariations: [
                    cityName,
                    cityName.toLowerCase(),
                    cityName.toUpperCase(),
                ].filter((name, index, arr) => arr.indexOf(name) === index),
                confidence: 'low',
                serviceAvailable: false
            };
        }

        try {
            const translatedName = await this.translateCityNameToEnglish(cityName);
            
            // Generate search variations for better database matching
            const searchVariations = [
                translatedName,
                translatedName.toLowerCase(),
                translatedName.toUpperCase(),
                // Add common variations
                translatedName.replace(/pur$/, 'pore'), // Kanpur -> Kanpore
                translatedName.replace(/bad$/, 'abad'), // Ahmadabad -> Ahmedabad
            ].filter((name, index, arr) => arr.indexOf(name) === index); // Remove duplicates

            return {
                original: cityName,
                translated: translatedName,
                searchVariations: searchVariations,
                confidence: translatedName === cityName ? 'high' : 'medium' // If same, likely already English
            };

        } catch (error) {
            console.error('Error processing search query:', error);
            return {
                original: cityName,
                translated: cityName,
                searchVariations: [cityName],
                confidence: 'low',
                error: error.message,
                serviceAvailable: false
            };
        }
    }
}

export default new GeminiService();