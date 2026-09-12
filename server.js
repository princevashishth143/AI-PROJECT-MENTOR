const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ ERROR: GEMINI_API_KEY not found in environment variables!");
} else {
  console.log("✅ GEMINI_API_KEY successfully loaded!");
}

// Initialize Google Gen AI client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

app.post('/api/chat', async (req, res) => {
  const { message, mode, projectName } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    let systemInstruction = "You are an advanced and versatile AI assistant. Answer fluently in English.";
    
    if (mode === "AI Mentor") {
      systemInstruction = `You are an expert AI Project Mentor guiding a computer science engineering student for their project '${projectName || "Software Project"}'. Provide professional guidance in English.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const aiReply = response.text;
    if (aiReply) {
      res.json({ reply: aiReply });
    } else {
      res.status(500).json({ error: "Failed to generate AI response from Gemini." });
    }

  } catch (err) {
    console.error("❌ Backend Catch Error:", err);
    res.status(500).json({ error: "Internal server error: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 APM Secure Backend running on port ${PORT}`);
});