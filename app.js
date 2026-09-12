// 1. Supabase Initialization
const SUPABASE_URL = 'https://cqmriruvvtdbkxrqkvzp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbXJpcnV2dnRkYmt4cnFrdnpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODExODQsImV4cCI6MjEwNDM1NzE4NH0.eGhrJA8pO5EVW5k4dzFUgY5P8zf4pup3S6GY7AlrlxA';
const dbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. DOM Elements
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const userAvatar = document.getElementById('userAvatar');
const displayUserName = document.getElementById('displayUserName');

const btnMentor = document.getElementById('btn-mentor');
const btnChat = document.getElementById('btn-chat');
const mentorView = document.getElementById('mentorView');
const chatView = document.getElementById('chatView');

// 3. Login & Avatar Logic
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('loginName').value.trim();
  const email = document.getElementById('loginEmail').value.trim();

  // Save to Database
  const { error } = await dbClient.from('users').insert([{ name, email }]);
  if (error && error.code !== '23505') {
    console.error(error);
    alert("Database error. Check console.");
    return;
  }

  // Update Avatar UI
  const initial = name.charAt(0).toUpperCase();
  userAvatar.textContent = initial;
  displayUserName.textContent = name;
  
  localStorage.setItem('userEmail', email);
  loginModal.classList.add('hidden');
});

// 4. Tab Switching Logic
btnMentor.addEventListener('click', () => {
  btnMentor.classList.add('active');
  btnChat.classList.remove('active');
  mentorView.classList.remove('hidden');
  chatView.classList.add('hidden');
  document.getElementById('header-text').innerHTML = `<div class="eyebrow">PROJECT INTELLIGENCE</div><h1>AI Mentor</h1><p>Plan, track and predict your project journey.</p>`;
});

btnChat.addEventListener('click', () => {
  btnChat.classList.add('active');
  btnMentor.classList.remove('active');
  chatView.classList.remove('hidden');
  mentorView.classList.add('hidden');
  document.getElementById('header-text').innerHTML = `<div class="eyebrow">GENERAL AI</div><h1>New Chat</h1><p>General-purpose conversation.</p>`;
});

// 5. Chat & Backend AI Call Logic (Secure & Fixed)
async function handleChatSubmit(e, formId, inputId, containerId, mode) {
  e.preventDefault();
  const input = document.getElementById(inputId);
  const text = input.value.trim();
  if (!text) return;

  const container = document.getElementById(containerId);

  // Safely Render User Message (XSS Protected)
  const userMsgDiv = document.createElement('div');
  userMsgDiv.className = 'msg user';
  const userBubble = document.createElement('div');
  userBubble.className = 'bubble';
  userBubble.textContent = text;
  userMsgDiv.appendChild(userBubble);
  container.appendChild(userMsgDiv);

  input.value = '';
  container.scrollTop = container.scrollHeight;

  // Render Loading / Thinking Bubble
  const botLoadingId = 'bot-loading-' + Date.now();
  const botMsgDiv = document.createElement('div');
  botMsgDiv.className = 'msg bot';
  botMsgDiv.id = botLoadingId;
  const botBubble = document.createElement('div');
  botBubble.className = 'bubble';
  botBubble.textContent = 'Thinking with Gemini AI...';
  botMsgDiv.appendChild(botBubble);
  container.appendChild(botMsgDiv);
  container.scrollTop = container.scrollHeight;

  const projectName = localStorage.getItem('currentProjectName') || "Software Project";

  try {
    // Call Live Render Backend (Using Correct /api/chat route)
    const response = await fetch('https://ai-project-mentor-5bka.onrender.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, mode: mode === 'mentor' ? 'AI Mentor' : 'General Chat', projectName })
    });

    const data = await response.json();
    const botMsgElement = document.getElementById(botLoadingId);

    let finalReply = "Failed to get response from AI backend.";
    if (data.reply) {
      finalReply = data.reply;
      botMsgElement.querySelector('.bubble').textContent = finalReply;
    } else {
      finalReply = data.error || finalReply;
      botMsgElement.querySelector('.bubble').textContent = finalReply;
    }

    // Save Both User Message and AI Reply to Supabase Database
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      await dbClient.from('chats').insert([
        { user_email: userEmail, mode: mode, role: 'user', message: text },
        { user_email: userEmail, mode: mode, role: 'assistant', message: finalReply }
      ]);
    }

  } catch (err) {
    console.error("Connection Error:", err);
    const botMsgElement = document.getElementById(botLoadingId);
    if (botMsgElement) {
      botMsgElement.querySelector('.bubble').textContent = "Server connection failed! Please check your network.";
    }
  }

  container.scrollTop = container.scrollHeight;
}

document.getElementById('mentorForm').addEventListener('submit', (e) => 
  handleChatSubmit(e, 'mentorForm', 'mentorInput', 'mentorMessages', 'mentor')
);

document.getElementById('generalForm').addEventListener('submit', (e) => 
  handleChatSubmit(e, 'generalForm', 'generalInput', 'generalMessages', 'general')
);
