const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// Static files (HTML, JS, CSS) ko ek hi jagah serve karne ke liye
app.use(express.static(path.join(__dirname)));

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Chat API Route
app.post('/api/chat', async (req, res) => {
  try {
    const { message, mode, projectName } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: `You are an AI Project Mentor for the project "${projectName || 'Software Project'}". Help students with code, logic, and debugging professionally.`
      }
    });

    res.json({ reply: response.text });
  } catch (err) {
    console.error('Gemini API Error:', err);
    res.status(500).json({ error: 'Failed to generate AI response. Please check API Key.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running smoothly on port ${PORT}`);
});