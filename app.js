// 1. Supabase Initialization
const SUPABASE_URL = 'https://cqmriruvvtdbkxrqkvzp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cGFiYXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODExODQsImV4cCI6MjEwNDM1NzE4NH0.eGhrJA8pO5EVW5k4dzFUgY5P8zf4pup3S6GY7AlrlxA';
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
    if (mentorView) mentorView.classList.remove('hidden');
    if (chatView) chatView.classList.add('hidden');
  });

  btnChat.addEventListener('click', () => {
    btnChat.classList.add('active');
    btnMentor.classList.remove('active');
    if (chatView) chatView.classList.remove('hidden');
    if (mentorView) mentorView.classList.add('hidden');
  });
}

// 4. Chat & Backend AI Call Logic
async function handleChatSubmit(e, formId, inputId, containerId, mode) {
  e.preventDefault();
  const input = document.getElementById(inputId);
  if (!input) return;
  
  const text = input.value.trim();
  if (!text) return;

  const container = document.getElementById(containerId);
  if (!container) return;

  const userMsgDiv = document.createElement('div');
  userMsgDiv.className = 'message user-msg';
  const userBubble = document.createElement('div');
  userBubble.textContent = text;
  userMsgDiv.appendChild(userBubble);
  container.appendChild(userMsgDiv);

  input.value = '';
  container.scrollTop = container.scrollHeight;

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

  const enhancedMessage = `[Context - Project: ${projectName}, Semester: ${userSem}, Known Languages: ${userLangs}] ${text}. Note: If the user asks about who made this project, state that this is a group project built as a mini project and hosted by Prince.`;

  try {
    // Ab frontend seedhe apne hi server ke relative path se baat karega (No CORS / No Server Failed error)
    const backendUrl = '/api/chat';

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: enhancedMessage, mode: mode === 'mentor' ? 'AI Mentor' : 'General Chat', projectName })
    });

    const data = await response.json();
    const botMsgElement = document.getElementById(botLoadingId);

    let finalReply = "Failed to get response from backend.";
    if (data.reply) {
      finalReply = data.reply.replace(/Gemini/gi, 'APM Assistant').replace(/Google/gi, 'Prince Vashishth');
      if (botMsgElement) botMsgElement.textContent = finalReply;
    } else {
      finalReply = data.error || finalReply;
      if (botMsgElement) botMsgElement.textContent = finalReply;
    }

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