import { Router } from "express";
import {
    translateCityName,
    batchTranslateCityNames,
    getCitySearchSuggestions,
    checkTranslationHealth,
    chatWithGemini
} from "../controllers/translate.controllers.js";

const router = Router();

// Health check endpoint
router.route("/health").get(checkTranslationHealth);

// Single city name translation
router.route("/city").post(translateCityName);

// Batch translation of multiple cities
router.route("/cities/batch").post(batchTranslateCityNames);

// Get search suggestions with optimization
router.route("/city/suggest").post(getCitySearchSuggestions);

// General Gemini AI chat endpoint
router.route("/chat").post(chatWithGemini);

export { router };