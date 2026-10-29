const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Badi images/data ke liye limit badha di hai

app.use(express.static(path.join(__dirname)));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, mode, projectName, image } = req.body;
    
    if (!message && !image) {
      return res.status(400).json({ error: 'Message or image is required' });
    }

    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY is missing in environment variables on Render.' });
    }

    // Message aur agar image hai toh uska content prepare karna
    let userContent = message || "Analyze this image.";
    
    // Agar frontend se image bheji gayi hai (camera/photo feature)
    let messagesList = [
      {
        role: "system",
        content: `You are an expert AI Project Mentor for the project "${projectName || 'Software Project'}". Provide thorough, detailed, and complete answers to help the user with coding, logic, architecture, and debugging in the language the user speaks.`
      }
    ];

    if (image) {
      // Agar image ke sath text bhejna ho
      messagesList.push({
        role: "user",
        content: [
          { type: "text", text: userContent },
          { type: "image_url", image_url: { url: image } }
        ]
      });
    } else {
      messagesList.push({
        role: "user",
        content: userContent
      });
    }

    // Groq API call (Model change karke llama-3.1-8b-instant kar diya hai taaki error na aaye)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // Sabse stable aur fast model
        messages: messagesList,
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