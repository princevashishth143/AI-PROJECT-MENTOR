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

// सभी वर्तमान और आने वाले लेटेस्ट मॉडल्स की फॉलबैक लिस्ट
const MODELS_TO_TRY = [
  'gemini-3.8-flash',
  'gemini-4.2-flash',
  'gemini-4.5-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

async function generateWithFallback(contents, config) {
  let lastError = null;
  
  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`Trying model: ${modelName}`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: config
      });
      if (response && response.text) {
        console.log(`Successfully generated using model: ${modelName}`);
        return response;
      }
    } catch (err) {
      console.warn(`Model ${modelName} failed or unavailable:`, err.message || err);
      lastError = err;
      // अगर कोई मॉडल उपलब्ध नहीं है या बिजी है, तो यह तुरंत अगले मॉडल पर स्विच हो जाएगा
    }
  }
  
  throw lastError || new Error('All fallback models failed to generate content.');
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, mode, projectName } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'API Key missing' });
    }

    const response = await generateWithFallback(
      message,
      {
        systemInstruction: `You are an expert AI Project Mentor for the project "${projectName || 'Software Project'}". Provide thorough, detailed, and complete answers to help the user with coding, logic, architecture, and debugging in the language the user speaks.`
      }
    );

    res.json({ reply: response.text });
  } catch (err) {
    console.error('All AI models failed:', err);
    res.status(500).json({ error: 'Server error: ' + (err.message || 'All models are currently busy.') });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});