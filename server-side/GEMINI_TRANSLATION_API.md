# 🌐 Gemini Translation API Documentation

## Overview
The BusBuddy Gemini Translation API provides advanced Hindi-to-English city name translation using Google's Gemini AI. This is essential for accurate database keyword searches when users input city names in Hindi (Devanagari script).

## Environment Setup
Add this to your `.env` file:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## API Endpoints

### 1. Health Check
**GET** `/api/translate/health`
- **Description**: Check if the translation service is working
- **Authentication**: None required
- **Response**:
```json
{
    "statusCode": 200,
    "data": {
        "status": "healthy",
        "testResult": "Delhi",
        "timestamp": "2025-09-26T10:30:00.000Z",
        "geminiApiAvailable": true
    },
    "message": "Translation service is healthy",
    "success": true
}
```

### 2. Single City Translation
**POST** `/api/translate/city`
- **Description**: Translate a single city name from Hindi to English
- **Authentication**: None required
- **Request Body**:
```json
{
    "cityName": "मुंबई"
}
```
- **Response**:
```json
{
    "statusCode": 200,
    "data": {
        "original": "मुंबई",
        "translated": "Mumbai",
        "searchVariations": ["Mumbai", "mumbai", "MUMBAI"],
        "confidence": "medium"
    },
    "message": "City name translated successfully",
    "success": true
}
```

### 3. Batch City Translation
**POST** `/api/translate/cities/batch`
- **Description**: Translate multiple city names at once (max 20)
- **Authentication**: None required
- **Request Body**:
```json
{
    "cityNames": ["मुंबई", "दिल्ली", "बंगलौर", "Chennai"]
}
```
- **Response**:
```json
{
    "statusCode": 200,
    "data": {
        "मुंबई": "Mumbai",
        "दिल्ली": "Delhi",
        "बंगलौर": "Bengaluru",
        "Chennai": "Chennai"
    },
    "message": "City names translated successfully",
    "success": true
}
```

### 4. Search Suggestions
**POST** `/api/translate/city/suggest`
- **Description**: Get optimized search suggestions for database queries
- **Authentication**: None required
- **Request Body**:
```json
{
    "cityName": "गुड़गांव"
}
```
- **Response**:
```json
{
    "statusCode": 200,
    "data": {
        "original": "गुड़गांव",
        "translated": "Gurgaon",
        "searchVariations": ["Gurgaon", "gurgaon", "GURGAON", "Gurugram"],
        "confidence": "medium",
        "recommendedSearchTerm": "Gurgaon",
        "alternativeTerms": ["Gurgaon", "Gurugram"],
        "isTranslationNeeded": true,
        "searchScore": 0.7
    },
    "message": "Search suggestions generated successfully",
    "success": true
}
```

### 5. Enhanced Bus Search with Translation
**GET** `/api/buses/search?query=मुंबई&translateHindi=true`
- **Description**: Search buses with automatic Hindi translation
- **Authentication**: None required
- **Parameters**:
  - `query` (string): Search term (can be in Hindi)
  - `translateHindi` (boolean): Enable Hindi translation (default: true)
  - `latitude` (number): Optional - User's latitude
  - `longitude` (number): Optional - User's longitude  
  - `radius` (number): Optional - Search radius in km (default: 5)

- **Response**:
```json
{
    "statusCode": 200,
    "data": {
        "buses": [
            {
                "busId": "BUS001",
                "busNumber": "MH12AB1234",
                "routeName": "Mumbai Central to Andheri",
                "driverName": "Rajesh Kumar",
                "isDriverOnline": true,
                "connectedPassengers": 15,
                "route": {
                    "startPoint": { "name": "Mumbai Central", "latitude": 19.0330, "longitude": 72.8397 },
                    "endPoint": { "name": "Andheri", "latitude": 19.1136, "longitude": 72.8697 },
                    "stops": [...]
                }
            }
        ],
        "searchInfo": {
            "originalQuery": "मुंबई",
            "translatedQuery": "Mumbai",
            "resultCount": 1,
            "searchRadius": null,
            "translationInfo": {
                "original": "मुंबई",
                "translated": "Mumbai",
                "searchVariations": ["Mumbai", "mumbai", "MUMBAI"],
                "confidence": "medium",
                "wasTranslated": true
            }
        }
    },
    "message": "Found 1 buses (translated from \"मुंबई\")",
    "success": true
}
```

## Demo & Testing Endpoints

### 6. Translation Test Demo
**GET** `/api/demo/test-translation`
- **Description**: Run comprehensive tests on predefined Hindi city names
- **Authentication**: None required
- **Response**: Shows translation results for 18+ Indian cities

### 7. Live Translation Demo
**POST** `/api/demo/demo-translate`
- **Description**: Interactive translation demo with performance metrics
- **Request Body**:
```json
{
    "cityName": "हैदराबाद"
}
```
- **Response**:
```json
{
    "success": true,
    "message": "City translated successfully",
    "data": {
        "input": "हैदराबाद",
        "output": "Hyderabad",
        "processingTime": "1247ms",
        "confidence": "medium",
        "wasTranslated": true,
        "searchVariations": ["Hyderabad", "hyderabad", "HYDERABAD"],
        "recommendedForSearch": "Hyderabad"
    }
}
```

## Advanced Features

### Smart City Matching
The system handles various input scenarios:
- **Pure Hindi**: `मुंबई` → `Mumbai`
- **Mixed Script**: `Mumbai मुंबई` → `Mumbai`  
- **Already English**: `Chennai` → `Chennai` (no change)
- **Misspelled English**: `Mumbi` → `Mumbai` (auto-correction)
- **Alternative Names**: `गुड़गांव` → `Gurgaon` (also suggests `Gurugram`)

### Search Optimization
- Generates multiple search variations for better database matching
- Confidence scoring for translation quality
- Fallback to original query if translation fails
- Performance tracking and monitoring

### Error Handling
- Graceful fallbacks when Gemini API is unavailable
- Input validation for city names
- Rate limiting protection
- Comprehensive error logging

## Usage Examples

### Frontend Integration (JavaScript)
```javascript
// Translate city name before search
async function searchBusesWithTranslation(cityName) {
    try {
        // Get translation suggestions
        const translationResponse = await fetch('/api/translate/city/suggest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cityName })
        });
        
        const translation = await translationResponse.json();
        const searchTerm = translation.data.recommendedSearchTerm;
        
        // Search buses with optimized term
        const searchResponse = await fetch(
            `/api/buses/search?query=${encodeURIComponent(searchTerm)}&translateHindi=true`
        );
        
        const results = await searchResponse.json();
        return results;
    } catch (error) {
        console.error('Search failed:', error);
        throw error;
    }
}

// Example usage
searchBusesWithTranslation('मुंबई').then(results => {
    console.log('Found buses:', results.data.buses);
    console.log('Translation info:', results.data.searchInfo.translationInfo);
});
```

### Mobile App Integration (React Native)
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

class CityTranslationService {
    static async translateWithCache(cityName) {
        const cacheKey = `translation_${cityName}`;
        
        // Check cache first
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        
        // Translate and cache
        const response = await fetch('/api/translate/city', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cityName })
        });
        
        const result = await response.json();
        
        // Cache for 24 hours
        await AsyncStorage.setItem(cacheKey, JSON.stringify(result.data));
        return result.data;
    }
}
```

## Performance Considerations

- **Response Time**: Typically 1-3 seconds per translation
- **Rate Limiting**: 5 requests per second per IP
- **Caching**: Consider implementing client-side caching for frequently used cities
- **Batch Processing**: Use batch endpoint for multiple cities to improve efficiency

## Supported Languages

**Input**: Hindi (Devanagari script), English, Mixed script
**Output**: English (standardized city names as used in official Indian databases)

## Common City Translations

| Hindi | English | Alternative |
|-------|---------|-------------|
| मुंबई | Mumbai | Bombay |
| दिल्ली | Delhi | New Delhi |
| बंगलौर | Bengaluru | Bangalore |
| चेन्नै | Chennai | Madras |
| कोलकाता | Kolkata | Calcutta |
| हैदराबाद | Hyderabad | - |
| पुणे | Pune | Poona |
| अहमदाबाद | Ahmedabad | - |
| जयपुर | Jaipur | - |
| गुड़गांव | Gurgaon | Gurugram |