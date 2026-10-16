const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ ERROR: GEMINI_API_KEY not found in environment variables!");
} else {
  console.log("✅ GEMINI_API_KEY successfully loaded!");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

app.post('/api/chat', async (req, res) => {
  const { message, mode, projectName, userSem, userLangs, imageBase64 } = req.body;

  if (!message && !imageBase64) {
    return res.status(400).json({ error: "Message or image is required" });
  }

  try {
    // Language matching instruction + Natural human tone + Group project info
    let systemInstruction = `You are a friendly, natural human assistant. STRICT RULE: Reply in the EXACT SAME LANGUAGE that the user uses. If the user asks in Hindi, reply in Hindi (e.g. "मैं ठीक हूँ, बताओ क्या मदद चाहिए?"). If the user asks in English, reply in English (e.g. "I am fine, how can I help you?"). If the user speaks Hinglish, reply in Hinglish. Keep answers short, direct, and conversational without robotic long intros. If someone asks who made this, state that this is a group project built as a mini project and hosted by Prince.`;
    
    if (mode === "AI Mentor") {
      systemInstruction = `You are a helpful project mentor guiding a student for their project '${projectName || "Software Project"}' (Semester: ${userSem || "N/A"}, Languages: ${userLangs || "General"}). STRICT RULE: Reply in the EXACT SAME LANGUAGE that the user uses (Hindi if user writes in Hindi, English if in English, Hinglish if in Hinglish). Keep answers short, direct, and natural. If someone asks who made this, state that this is a group project built as a mini project and hosted by Prince.`;
    }

    let contents = message || "Please check this image.";
    if (imageBase64) {
      const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        contents = [
          { text: message || "Look at this image." },
          { inlineData: { mimeType: matches[1], data: matches[2] } }
        ];
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    let aiReply = response.text;
    if (aiReply) {
      aiReply = aiReply.replace(/Gemini/gi, 'Assistant').replace(/Google/gi, 'Prince');
      res.json({ reply: aiReply });
    } else {
      res.status(500).json({ error: "Failed to generate response." });
    }

  } catch (err) {
    console.error("❌ Backend Catch Error:", err);
    res.status(500).json({ error: "Internal server error: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 APM Secure Backend running on port ${PORT}`);
});