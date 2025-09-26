import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// ES6 module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({
  path: path.join(__dirname, "../../../.env"),
});

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  console.warn("⚠️ ELEVENLABS_API_KEY is missing in .env file");
}

/**
 * Transcribe an audio file using ElevenLabs STT API
 * @param {string} filePath - Path to audio file
 * @returns {Promise<{ text: string, language: string, confidence: number|null, duration: number|null }>}
 */
export async function transcribeAudio(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error("Audio file not found");
    }

    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === "your_elevenlabs_api_key_here") {
      throw new Error("Invalid or missing ElevenLabs API key");
    }

    const allowedExt = /\.(mp3|wav|ogg|webm|m4a)$/i;
    if (!allowedExt.test(filePath)) {
      throw new Error("Invalid file type. Supported: mp3, wav, ogg, webm, m4a");
    }

    const stats = fs.statSync(filePath);
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (stats.size > maxSize) {
      throw new Error("File too large. Must be under 25MB");
    }

    // Prepare form data
    const FormData = (await import("form-data")).default;
    const form = new FormData();
    const audioBuffer = fs.readFileSync(filePath);

    form.append("file", audioBuffer, {
      filename: path.basename(filePath),
      contentType: "audio/mpeg", // fallback, server infers
    });

    form.append("model_id", "scribe_v1");
    form.append("response_format", "json");

    const fetch = (await import("node-fetch")).default;

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        ...form.getHeaders(),
      },
      body: form,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs API error (${response.status}): ${errText}`);
    }

    const result = await response.json();

    return {
      text: result.text || result.transcript || "",
      language: result.language || result.detected_language || "unknown",
      confidence: result.confidence || null,
      duration: result.duration || null,
    };
  } catch (err) {
    console.error("❌ Transcription error:", err.message);
    throw err;
  } finally {
    // optional: clean up file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
