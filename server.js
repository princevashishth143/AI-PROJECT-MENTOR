const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(express.json({ limit: '20mb' }));
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
    let systemInstruction = `You are a friendly, natural human assistant. STRICT RULE: Reply in the EXACT SAME LANGUAGE that the user uses (Hindi if Hindi, English if English, Hinglish if Hinglish). Keep answers short, direct, and natural. If someone asks who made this, state that this is a group project built as a mini project and hosted by Prince.`;
    
    if (mode === "AI Mentor") {
      systemInstruction = `You are a helpful project mentor guiding a student for their project '${projectName || "Software Project"}' (Semester: ${userSem || "N/A"}, Languages: ${userLangs || "General"}). STRICT RULE: Reply in the exact same language the user uses. Keep answers short and direct. If someone asks who made this, state that this is a group project built as a mini project and hosted by Prince.`;
    }

    // Prepare contents array for text and image
    let contents = [];
    
    if (imageBase64) {
      // Clean base64 string if it contains data URI prefix
      const base64Data = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;
      const mimeMatch = imageBase64.match(/data:([^;]+);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
      contents.push(message || "Please identify this person or analyze this image.");
    } else {
      contents.push(message);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
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