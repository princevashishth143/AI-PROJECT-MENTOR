const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// Static files (HTML, CSS, JS) serve karne ke liye
app.use(express.static(path.join(__dirname)));

const apiKey = process.env.GEMINI_API_KEY;
console.log('--- SERVER STARTING ---');
console.log('API Key Status:', apiKey ? 'Loaded Successfully!' : 'WARNING: GEMINI_API_KEY is missing!');

const ai = new GoogleGenAI({ apiKey: apiKey });

// Health check route taaki logs mein dikhe ki server live hai
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running live and healthy!' });
});

// Chat API Route
app.post('/api/chat', async (req, res) => {
  try {
    const { message, mode, projectName } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'Server error: GEMINI_API_KEY is not configured in Render Environment Variables.' });
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
    res.status(500).json({ error: 'Failed to generate AI response: ' + err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SUCCESS] Server is running smoothly on port ${PORT}`);
});