# 🔑 How to Get Your Gemini API Key

## Step 1: Go to Google AI Studio
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account

## Step 2: Create API Key
1. Click on **"Get API key"** in the left sidebar
2. Click **"Create API key"**
3. Choose **"Create API key in new project"** (or select an existing project)
4. Copy the generated API key

## Step 3: Add to Your Environment
1. Open your `.env` file in the root directory
2. Replace `your_gemini_api_key_here` with your actual API key:
```env
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 4: Restart Your Server
```bash
npm run dev
```

## ✅ Verify It's Working
Test the translation service:
```bash
# Health check
curl http://localhost:5001/api/translate/health

# Test translation
curl -X POST http://localhost:5001/api/translate/city \
  -H "Content-Type: application/json" \
  -d '{"cityName": "मुंबई"}'
```

## 🔒 Important Notes
- Keep your API key secure and never commit it to version control
- The key is free to use with generous limits
- If the key is not configured, the service will gracefully fallback to returning original city names

## 📊 API Limits (Free Tier)
- 15 requests per minute
- 1,500 requests per day
- 1 million tokens per month

Perfect for development and moderate production use!