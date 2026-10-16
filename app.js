// 1. Supabase Initialization
const SUPABASE_URL = 'https://cqmriruvvtdbkxrqkvzp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbXJpcnV2dnRkYmt4cnFrdnpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODExODQsImV4cCI6MjEwNDM1NzE4NH0.eGhrJA8pO5EVW5k4dzFUgY5P8zf4pup3S6GY7AlrlxA';
const dbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. DOM Elements for Tabs and Views
const btnMentor = document.getElementById('btn-mentor');
const btnChat = document.getElementById('btn-chat');
const mentorView = document.getElementById('mentorView');
const chatView = document.getElementById('chatView');

// 3. Tab Switching Logic
if (btnMentor && btnChat) {
  btnMentor.addEventListener('click', () => {
    btnMentor.classList.add('active');
    btnChat.classList.remove('active');
    mentorView.classList.remove('hidden');
    chatView.classList.add('hidden');
  });

  btnChat.addEventListener('click', () => {
    btnChat.classList.add('active');
    btnMentor.classList.remove('active');
    chatView.classList.remove('hidden');
    mentorView.classList.add('hidden');
  });
}

// 4. Chat & Backend AI Call Logic (Secure & Fixed)
async function handleChatSubmit(e, formId, inputId, containerId, mode) {
  e.preventDefault();
  const input = document.getElementById(inputId);
  if (!input) return;
  
  const text = input.value.trim();
  if (!text) return;

  const container = document.getElementById(containerId);
  if (!container) return;

  // Safely Render User Message (XSS Protected)
  const userMsgDiv = document.createElement('div');
  userMsgDiv.className = 'message user-msg';
  const userBubble = document.createElement('div');
  userBubble.textContent = text;
  userMsgDiv.appendChild(userBubble);
  container.appendChild(userMsgDiv);

  input.value = '';
  container.scrollTop = container.scrollHeight;

  // Render Loading / Thinking Bubble
  const botLoadingId = 'bot-loading-' + Date.now();
  const botMsgDiv = document.createElement('div');
  botMsgDiv.className = 'message bot-msg';
  botMsgDiv.id = botLoadingId;
  botMsgDiv.textContent = 'Thinking...';
  container.appendChild(botMsgDiv);
  container.scrollTop = container.scrollHeight;

  const projectName = localStorage.getItem('currentProjectName') || "Software Project";
  const userLangs = localStorage.getItem('currentProjectLangs') || "General";
  const userSem = localStorage.getItem('currentProjectSem') || "N/A";

  // Enhanced message context for backend
  const enhancedMessage = `[Context - Project: ${projectName}, Semester: ${userSem}, Known Languages: ${userLangs}] ${text}. Note: If the user asks about who made this project or what kind of project it is, state that this is a group project built as a mini project and hosted by Prince. Otherwise, focus purely on technical project mentorship.`;

  try {
    // Call Live Render Backend
    const response = await fetch('https://ai-project-mentor-5bka.onrender.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: enhancedMessage, mode: mode === 'mentor' ? 'AI Mentor' : 'General Chat', projectName })
    });

    const data = await response.json();
    const botMsgElement = document.getElementById(botLoadingId);

    let finalReply = "Failed to get response from backend.";
    if (data.reply) {
      // Clean any generic AI references if returned
      finalReply = data.reply.replace(/Gemini/gi, 'APM Assistant').replace(/Google/gi, 'Prince Vashishth');
      if (botMsgElement) botMsgElement.textContent = finalReply;
    } else {
      finalReply = data.error || finalReply;
      if (botMsgElement) botMsgElement.textContent = finalReply;
    }

    // Save Both User Message and AI Reply to Supabase Database chats table
    const userEmail = localStorage.getItem('currentUserEmail');
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
      botMsgElement.textContent = "Server connection failed! Please check your network.";
    }
  }

  container.scrollTop = container.scrollHeight;
}

// Attach Event Listeners if forms exist
const mentorForm = document.getElementById('mentorForm');
if (mentorForm) {
  mentorForm.addEventListener('submit', (e) => 
    handleChatSubmit(e, 'mentorForm', 'messageInput', 'chatMessages', 'mentor')
  );
}

const generalForm = document.getElementById('generalForm');
if (generalForm) {
  generalForm.addEventListener('submit', (e) => 
    handleChatSubmit(e, 'generalForm', 'normalMessageInput', 'normalChatMessages', 'general')
  );
}