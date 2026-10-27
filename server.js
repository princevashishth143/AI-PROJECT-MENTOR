const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname)));

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

app.post('/api/chat', async (req, res) => {
  try {
    const { message, mode, projectName } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'API Key missing' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction: `You are an expert AI Project Mentor for the project "${projectName || 'Software Project'}". Provide thorough, detailed, and complete answers to help the user with coding, logic, architecture, and debugging in the language the user speaks.`
      }
    });

    res.json({ reply: response.text });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});