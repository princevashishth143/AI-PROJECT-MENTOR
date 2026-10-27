const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini API (Vercel ke Environment Variable se key lega)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Root route taaki pata chale server chal raha hai
app.get('/', (req, res) => {
  res.send('APM - AI Project Mentor Backend is Running!');
});

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

// Export for Vercel Serverless
module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}