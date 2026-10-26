const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Main Chat API Route
app.post('/api/chat', async (req, res) => {
  try {
    const { message, mode, projectName, userSem, userLangs, imageBase64 } = req.body;
    
    if (!message && !imageBase64) {
      return res.status(400).json({ error: 'Message or image is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    let promptText = `You are an expert AI Project Mentor. 
    Context:
    - Mode: ${mode || 'General'}
    - Project Name: ${projectName || 'General Project'}
    - Semester: ${userSem || 'N/A'}
    - Technologies: ${userLangs || 'N/A'}

    User Message: ${message}`;

    let contents = [promptText];

    // Handle Image if uploaded
    if (imageBase64) {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const mimeTypeMatch = imageBase64.match(/data:(image\/\w+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

      contents.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    const result = await model.generateContent(contents);
    const responseText = await result.response.text();

    res.json({ reply: responseText });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('APM - AI Project Mentor Backend is Running!');
});

// For local testing
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel Serverless
module.exports = app;