const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// फ्रंटएंड की फाइलें सर्व करने के लिए
app.use(express.static(path.join(__dirname)));

const apiKey = process.env.GEMINI_API_KEY;
console.log('--- SERVER STARTING ---');
console.log('API Key Status:', apiKey ? 'Loaded Successfully!' : 'WARNING: GEMINI_API_KEY is missing!');

const ai = new GoogleGenAI({ apiKey: apiKey });

// हेल्थ चेक रूट
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running live and healthy!' });
});

// चैट एपीआई रूट (यहाँ हमने नया gemini-3.8-flash मॉडल सेट कर दिया है)
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
      model: 'gemini-3.8-flash', // नया और लेटेस्ट मॉडल
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