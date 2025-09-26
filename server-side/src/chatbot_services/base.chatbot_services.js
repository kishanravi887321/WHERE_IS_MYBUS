import { transcribeAudio } from "./transcript.chatbot_services.js";
import { processVoiceForDestinations } from "./destination.extractor.js";

export const processAudio = async (req, res) => {
  console.log("🎵 Audio transcription endpoint hit");
  console.log("Request file:", req.file);

  try {
    // 1. Validate file presence
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No audio file uploaded",
        message: "Please upload an audio file",
      });
    }

    console.log("📁 File details:", {
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
    });

    // 2. Call ElevenLabs utils to transcribe
    const transcription = await transcribeAudio(req.file.path);
    const transcribedText = transcription.text;
    const detectedLanguage = transcription.language;

    console.log(`🎯 Transcribed (${detectedLanguage}): "${transcribedText}"`);

    // 3. Extract source and destination using Gemini AI
    console.log("🗺️ Extracting destinations...");
    const destinationResult = await processVoiceForDestinations(transcribedText, detectedLanguage);

    // 4. Return comprehensive response
    res.json({
      success: true,
      data: {
        transcription: {
          text: transcribedText,
          language: detectedLanguage,
          model: "ElevenLabs scribe_v1"
        },
        destinations: {
          source: destinationResult.source,
          destination: destinationResult.destination,
          isValidRoute: destinationResult.isValidRoute
        },
        processing: {
          originalText: transcribedText,
          extractionSuccess: destinationResult.success,
          readyForBusSearch: destinationResult.isValidRoute
        }
      },
      message: destinationResult.isValidRoute ? 
        `Route extracted: ${destinationResult.source} → ${destinationResult.destination}` :
        "Transcription successful, but route unclear. Please specify source and destination."
    });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: err.message,
    });
  }
};
