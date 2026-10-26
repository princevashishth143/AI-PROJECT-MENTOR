const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      systemInstruction: systemInstruction
    });

    let parts = [];
    
    if (imageBase64) {
      const base64Data = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;
      const mimeMatch = imageBase64.match(/data:([^;]+);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
      parts.push(message || "Please analyze this image.");
    } else {
      parts.push(message);
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    let aiReply = response.text();

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