# 🎵 Audio Transcription API Documentation

## Overview
The BusBuddy Audio Transcription API converts speech audio files to text using ElevenLabs Speech-to-Text service. This is useful for voice-based bus search queries and accessibility features.

## Endpoint
**POST** `/api/chatbot/transcribe`

## Authentication
None required (public endpoint)

## Request Format
- **Content-Type**: `multipart/form-data`
- **File Field Name**: `audio`
- **Supported Formats**: mp3, wav, ogg, webm, m4a, aac, flac
- **Max File Size**: 25MB

## cURL Examples

### Test with Audio File
```bash
# Upload an audio file for transcription
curl -X POST http://localhost:5001/api/chatbot/transcribe \
  -F "audio=@/path/to/your/audio.wav"
```

### Test with JavaScript/FormData
```javascript
const formData = new FormData();
formData.append('audio', audioFile); // audioFile is a File object

fetch('http://localhost:5001/api/chatbot/transcribe', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => {
    console.log('Transcription:', data);
});
```

## Response Examples

### Success Response (200)
```json
{
    "success": true,
    "data": {
        "text": "Where is the bus to Mumbai Central?",
        "language": "en",
        "confidence": 0.95,
        "duration": 3.2
    },
    "message": "Audio transcribed successfully"
}
```

### Error Responses

#### No File Uploaded (400)
```json
{
    "success": false,
    "error": "No audio file uploaded",
    "message": "Please upload an audio file"
}
```

#### Invalid File Type (400)
```json
{
    "success": false,
    "error": "Invalid file type", 
    "message": "Please upload an audio file (mp3, wav, ogg, webm, m4a)"
}
```

#### File Too Large (400)
```json
{
    "success": false,
    "error": "File too large",
    "message": "Audio file must be smaller than 25MB"
}
```

#### Service Unavailable (503)
```json
{
    "success": false,
    "error": "Transcription service unavailable",
    "message": "Audio transcription service is not configured. Please contact administrator."
}
```

#### Transcription Failed (500)
```json
{
    "success": false,
    "error": "Transcription failed", 
    "message": "Failed to transcribe audio. Please try again.",
    "details": "Service temporarily unavailable"
}
```

## Integration with Bus Search

Once you get the transcribed text, you can use it with the bus search API:

```javascript
// 1. Transcribe audio
const transcribeAudio = async (audioFile) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    const response = await fetch('/api/chatbot/transcribe', {
        method: 'POST',
        body: formData
    });
    
    const result = await response.json();
    return result.data.text;
};

// 2. Search buses with transcribed text
const searchBuses = async (searchQuery) => {
    const response = await fetch(`/api/buses/search?query=${encodeURIComponent(searchQuery)}&translateHindi=true`);
    return await response.json();
};

// 3. Complete flow
const handleVoiceSearch = async (audioFile) => {
    try {
        // Transcribe speech to text
        const searchQuery = await transcribeAudio(audioFile);
        console.log('User said:', searchQuery);
        
        // Search buses with the transcribed query
        const busResults = await searchBuses(searchQuery);
        console.log('Found buses:', busResults.data.buses);
        
        return busResults;
    } catch (error) {
        console.error('Voice search failed:', error);
        throw error;
    }
};
```

## Testing with Postman

1. **Method**: POST
2. **URL**: `http://localhost:5001/api/chatbot/transcribe`
3. **Body Type**: form-data
4. **Key**: `audio` (File type)
5. **Value**: Select an audio file

## Supported Languages

ElevenLabs supports multiple languages including:
- English
- Spanish
- French
- German
- Italian
- Portuguese
- Hindi
- Polish
- Turkish
- Russian
- Dutch
- Czech
- Arabic
- Chinese (Mandarin)
- Japanese
- Hungarian
- Korean

## Performance & Limitations

- **Processing Time**: 1-5 seconds depending on file size
- **Accuracy**: 85-98% depending on audio quality and language
- **Rate Limits**: Based on ElevenLabs plan (free tier: ~1000 requests/month)
- **Optimal Audio**: 
  - Clear speech
  - Minimal background noise
  - 16kHz+ sample rate
  - Mono or stereo

## Error Handling

The API includes comprehensive error handling:
- File validation before processing
- Automatic cleanup of temporary files
- Graceful fallbacks when service is unavailable
- Detailed error messages for debugging

## Environment Setup

Add to your `.env` file:
```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

Get your API key from [ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)