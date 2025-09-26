// Test script for audio transcription
// Usage: node test-transcription.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testTranscription() {
    console.log('🧪 Testing Audio Transcription API...');
    
    try {
        const fetch = (await import('node-fetch')).default;
        const FormData = (await import('form-data')).default;
        
        // Test with a simple audio file (you can replace this with an actual audio file)
        const testAudioPath = path.join(__dirname, 'test-audio.wav');
        
        if (!fs.existsSync(testAudioPath)) {
            console.log('📄 No test audio file found. Testing with empty request...');
            
            // Test without file (should return 400 error)
            const response = await fetch('http://localhost:5001/api/chatbot/transcribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            
            const result = await response.json();
            console.log('📊 Response status:', response.status);
            console.log('📊 Response:', result);
            
            if (response.status === 400 && result.error === 'No audio file uploaded') {
                console.log('✅ API is working correctly (returns proper error for missing file)');
            } else {
                console.log('❌ Unexpected response');
            }
            
            return;
        }
        
        // Test with actual audio file
        const form = new FormData();
        form.append('audio', fs.createReadStream(testAudioPath));
        
        const response = await fetch('http://localhost:5001/api/chatbot/transcribe', {
            method: 'POST',
            body: form
        });
        
        const result = await response.json();
        console.log('📊 Response status:', response.status);
        console.log('📊 Response:', result);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testTranscription();