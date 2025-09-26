import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import dotenv from "dotenv";

// ES6 module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({
  path: path.join(__dirname, "../../../.env")
});

// ElevenLabs API key with debug logging
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

console.log('🔑 API Key Check:', {
  keyExists: !!ELEVENLABS_API_KEY,
  keyLength: ELEVENLABS_API_KEY?.length || 0,
  envPath: path.join(__dirname, "../../../.env")
});

export const transcribeAudio = async (req, res) => {
    console.log('🎵 Audio transcription endpoint hit');
    console.log('Request file:', req.file);
    
    try {
        // Check if file was uploaded
        if (!req.file) {
            console.log('❌ No file uploaded');
            return res.status(400).json({ 
                success: false,
                error: "No audio file uploaded",
                message: "Please upload an audio file"
            });
        }

        console.log('📁 File details:', {
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        });

        // Validate file type
        const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a'];
        if (!allowedTypes.includes(req.file.mimetype) && !req.file.originalname.match(/\.(mp3|wav|ogg|webm|m4a)$/i)) {
            // Clean up uploaded file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                error: "Invalid file type",
                message: "Please upload an audio file (mp3, wav, ogg, webm, m4a)"
            });
        }

        // Check file size (limit: 25MB)
        const maxSize = 25 * 1024 * 1024; // 25MB
        if (req.file.size > maxSize) {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                error: "File too large",
                message: "Audio file must be smaller than 25MB"
            });
        }

        // Check if ElevenLabs API key is available
        if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'your_elevenlabs_api_key_here') {
            console.log('⚠️ ElevenLabs API key not configured');
            
            // Clean up uploaded file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            
            return res.status(503).json({
                success: false,
                error: "Transcription service unavailable",
                message: "Audio transcription service is not configured. Please contact administrator."
            });
        }

        console.log('🔄 Starting audio transcription...');

        // Create form data for ElevenLabs API
        const FormData = (await import('form-data')).default;
        const form = new FormData();
        
        // Read file and append to form (ElevenLabs expects 'file' parameter)
        const audioBuffer = fs.readFileSync(req.file.path);
        form.append('file', audioBuffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });
        
        // Add required model_id parameter (use valid ElevenLabs Speech-to-Text model)
        form.append('model_id', 'scribe_v1');
        
        // Enable auto-detection for Hindi and English support
        // Remove language_code to allow auto-detection of Hindi/English
        form.append('response_format', 'json');
        
        console.log('🌍 Language detection: Auto (Hindi/English supported)');

        // Call ElevenLabs Speech-to-Text API
        const fetch = (await import('node-fetch')).default;
        const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
            method: "POST",
            headers: {
                "xi-api-key": ELEVENLABS_API_KEY,
                ...form.getHeaders()
            },
            body: form
        });

        console.log('📡 ElevenLabs API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ ElevenLabs API error:', errorText);
            
            // Clean up uploaded file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            
            return res.status(500).json({
                success: false,
                error: "Transcription failed",
                message: "Failed to transcribe audio. Please try again.",
                details: response.status === 401 ? "Invalid API key" : "Service temporarily unavailable"
            });
        }

        const result = await response.json();
        console.log('✅ Transcription result:', result);

        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
            console.log('🗑️ Temporary file cleaned up');
        }

        // ElevenLabs returns the transcribed text directly in the 'text' field
        const transcribedText = result.text || result.transcript || "";
        const detectedLanguage = result.language || result.detected_language || "auto-detected";
        
        console.log(`🎯 Transcribed (${detectedLanguage}): "${transcribedText}"`);
        
        // Return successful response
        res.json({
            success: true,
            data: {
                text: transcribedText,
                language: detectedLanguage,
                confidence: result.confidence || null,
                duration: result.duration || null,
                model_used: "scribe_v1",
                supports: "Hindi, English, and auto-detection"
            },
            message: `Audio transcribed successfully (Language: ${detectedLanguage})`
        });

    } catch (error) {
        console.error("❌ Transcription error:", error);
        
        // Clean up uploaded file if it exists
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
                console.log('🗑️ Temporary file cleaned up after error');
            } catch (cleanupError) {
                console.error('Failed to cleanup temp file:', cleanupError);
            }
        }
        
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "An error occurred while processing the audio file",
            details: error.message
        });
    }
};
