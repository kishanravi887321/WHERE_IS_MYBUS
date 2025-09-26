import { GoogleGenAI } from "@google/genai";

// Initialize Gemini with new API structure
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyD8xe1lVI-ixyGx1ymcKrQghAK80tbfkvw";
if (!GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY missing in .env");
}
const ai = new GoogleGenAI({ 
  apiKey: GEMINI_API_KEY 
});

/**
 * Extract source and destination from transcribed text using Gemini AI
 * @param {string} transcribedText - The transcribed text from user's voice
 * @returns {Promise<Object>} - Object containing source and destination
 */
export const extractDestinations = async (transcribedText) => {
  try {
    console.log(`🗺️ Extracting destinations from: "${transcribedText}"`);
    
    // Create a detailed prompt for extracting source and destination
    const prompt = `
You are a travel destination extraction assistant. Your task is to extract the source (starting point) and destination (ending point) from the user's travel query.

User Query: "${transcribedText}"

IMPORTANT RULES:
1. Return ONLY a JSON object with "source" and "destination" fields
2. Convert all place names to English if they are in Hindi or other languages
3. First letter of each word should be CAPITAL (proper case)
4. Use commonly known English names for Indian cities
5. If source is not mentioned, use "Current Location" 
6. If destination is not clear, use "Unknown"
7. Handle common variations like "Delhi" for "New Delhi"

Examples:
- "मुझे दिल्ली से मुंबई जाना है" → {"source": "Delhi", "destination": "Mumbai"}
- "I want to go from Bangalore to Chennai" → {"source": "Bangalore", "destination": "Chennai"}
- "Delhi से Kolkata जाना है" → {"source": "Delhi", "destination": "Kolkata"}
- "मुझे Goa जाना है" → {"source": "Current Location", "destination": "Goa"}
- "Pune to Nashik" → {"source": "Pune", "destination": "Nashik"}

Common Hindi to English conversions:
- दिल्ली/दिल्हि → Delhi
- मुंबई/बम्बई → Mumbai  
- कोलकाता/कलकत्ता → Kolkata
- चेन्नई/मद्रास → Chennai
- बैंगलोर/बेंगलुरु → Bangalore
- हैदराबाद → Hyderabad
- पुणे → Pune
- अहमदाबाद → Ahmedabad
- जयपुर → Jaipur
- लखनऊ → Lucknow

Return ONLY the JSON object, no explanations:
`;

    const geminiResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    
    const responseText = geminiResponse.text.trim();
    console.log("🤖 Gemini Raw Response:", responseText);
    
    // Try to parse the JSON response
    let extractedData;
    try {
      // Remove any markdown code blocks or extra formatting
      const cleanedResponse = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/^[^{]*/, '')
        .replace(/[^}]*$/, '')
        .trim();
      
      extractedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.warn("⚠️ Failed to parse Gemini response as JSON:", parseError.message);
      console.log("Raw response:", responseText);
      
      // Fallback: try to extract using regex
      extractedData = extractDestinationsWithRegex(transcribedText);
    }
    
    // Validate and normalize the extracted data
    const normalizedData = {
      source: normalizeDestination(extractedData.source || "Current Location"),
      destination: normalizeDestination(extractedData.destination || "Unknown")
    };
    
    console.log("🎯 Extracted destinations:", normalizedData);
    return normalizedData;
    
  } catch (error) {
    console.error("❌ Error extracting destinations:", error);
    
    // Fallback to regex-based extraction
    console.log("🔄 Falling back to regex extraction...");
    return extractDestinationsWithRegex(transcribedText);
  }
};

/**
 * Fallback function to extract destinations using regex patterns
 * @param {string} text - The transcribed text
 * @returns {Object} - Object containing source and destination
 */
const extractDestinationsWithRegex = (text) => {
  const normalizedText = text.toLowerCase();
  
  // Common patterns for source and destination
  const patterns = {
    // Pattern: "from X to Y" or "X se Y"  
    fromTo: /(from|से)\s+([a-zA-Zअ-ह\s]+?)\s+(to|tak|तक|\s+)\s+([a-zA-Zअ-ह\s]+)/i,
    // Pattern: "X to Y" or "X से Y"
    directTo: /([a-zA-Zअ-ह\s]+?)\s+(to|se|से)\s+([a-zA-Zअ-ह\s]+)/i,
    // Pattern: "जाना है X" or "go to X"
    goTo: /(go\s+to|जाना\s+है)\s+([a-zA-Zअ-ह\s]+)/i,
  };
  
  let source = "Current Location";
  let destination = "Unknown";
  
  // Try different patterns
  if (patterns.fromTo.test(normalizedText)) {
    const match = normalizedText.match(patterns.fromTo);
    source = match[2].trim();
    destination = match[4].trim();
  } else if (patterns.directTo.test(normalizedText)) {
    const match = normalizedText.match(patterns.directTo);
    source = match[1].trim();
    destination = match[3].trim();
  } else if (patterns.goTo.test(normalizedText)) {
    const match = normalizedText.match(patterns.goTo);
    destination = match[2].trim();
  }
  
  return {
    source: normalizeDestination(source),
    destination: normalizeDestination(destination)
  };
};

/**
 * Normalize destination names to proper English format
 * @param {string} destination - Raw destination name
 * @returns {string} - Normalized destination name
 */
const normalizeDestination = (destination) => {
  if (!destination || destination.trim() === "") {
    return "Unknown";
  }
  
  const cleaned = destination.trim().toLowerCase();
  
  // Hindi to English city name mappings
  const cityMappings = {
    'दिल्ली': 'Delhi',
    'दिल्हि': 'Delhi', 
    'नई दिल्ली': 'New Delhi',
    'मुंबई': 'Mumbai',
    'बम्बई': 'Mumbai',
    'कोलकाता': 'Kolkata', 
    'कलकत्ता': 'Kolkata',
    'चेन्नई': 'Chennai',
    'मद्रास': 'Chennai',
    'बैंगलोर': 'Bangalore',
    'बेंगलुरु': 'Bangalore',
    'हैदराबाद': 'Hyderabad',
    'पुणे': 'Pune',
    'अहमदाबाद': 'Ahmedabad',
    'जयपुर': 'Jaipur',
    'लखनऊ': 'Lucknow',
    'कानपुर': 'Kanpur',
    'नागपुर': 'Nagpur',
    'इंदौर': 'Indore',
    'भोपाल': 'Bhopal',
    'विशाखापत्तनम': 'Visakhapatnam',
    'पटना': 'Patna',
    'वडोदरा': 'Vadodara',
    'लुधियाना': 'Ludhiana',
    'आगरा': 'Agra',
    'नाशिक': 'Nashik',
    'गोवा': 'Goa'
  };
  
  // Check if it's a Hindi city name
  if (cityMappings[cleaned]) {
    return cityMappings[cleaned];
  }
  
  // Convert to proper case (first letter capital)
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Main function to be used in the API endpoint
 * @param {string} transcribedText - The transcribed text from voice
 * @param {string} detectedLanguage - The detected language 
 * @returns {Promise<Object>} - Processed result with destinations
 */
export const processVoiceForDestinations = async (transcribedText, detectedLanguage) => {
  try {
    // Extract source and destination
    const destinations = await extractDestinations(transcribedText);
    
    // Log the results
    console.log(`🗺️ Voice Processing Results:`);
    console.log(`   Original Text (${detectedLanguage}): "${transcribedText}"`);
    console.log(`   Source: ${destinations.source}`);
    console.log(`   Destination: ${destinations.destination}`);
    
    return {
      success: true,
      originalText: transcribedText,
      detectedLanguage: detectedLanguage,
      source: destinations.source,
      destination: destinations.destination,
      isValidRoute: destinations.source !== "Unknown" && destinations.destination !== "Unknown"
    };
    
  } catch (error) {
    console.error("❌ Error processing voice for destinations:", error);
    
    return {
      success: false,
      error: error.message,
      originalText: transcribedText,
      detectedLanguage: detectedLanguage,
      source: "Unknown",
      destination: "Unknown", 
      isValidRoute: false
    };
  }
};