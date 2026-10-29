const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname)));

// यहाँ हम Groq की API Key एनवायरनमेंट वेरिएबल से लेंगे
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, mode, projectName } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY is missing in environment variables on Render.' });
    }

    // GroqCloud API को डायरेक्ट फेच (fetch) से कॉल करना
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Groq का सबसे तेज और पावरफुल मॉडल
        messages: [
          {
            role: "system",
            content: `You are an expert AI Project Mentor for the project "${projectName || 'Software Project'}". Provide thorough, detailed, and complete answers to help the user with coding, logic, architecture, and debugging in the language the user speaks.`
          },
          {
            role: "user",
            content: message
          }
        ],
        stream: false
      })
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      throw new Error(data.error?.message || 'Failed to communicate with Groq API');
    }

    const reply = data.choices[0].message.content;
    res.json({ reply });

  } catch (err) {
    console.error('Groq API Error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});