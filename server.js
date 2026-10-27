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

// 503 हाई डिमांड एरर आने पर ऑटोमैटिक दोबारा कोशिश करने का फंक्शन
async function generateWithRetry(model, contents, config, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: config
      });
      return response;
    } catch (err) {
      const isOverloaded = err.status === 503 || (err.message && err.message.includes('503')) || (err.message && err.message.includes('high demand'));
      if (isOverloaded && i < retries - 1) {
        console.log(`High demand (503). Retrying attempt ${i + 2} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // समय बढ़ाते हुए दोबारा ट्राई करेगा
      } else {
        throw err;
      }
    }
  }
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

    const response = await generateWithRetry(
      'gemini-3.8-flash',
      message,
      {
        systemInstruction: `You are an expert AI Project Mentor for the project "${projectName || 'Software Project'}". Provide thorough, detailed, and complete answers to help the user with coding, logic, architecture, and debugging in the language the user speaks.`
      }
    );

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