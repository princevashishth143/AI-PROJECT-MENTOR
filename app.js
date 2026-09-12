// 1. Supabase Initialization
const SUPABASE_URL = 'https://cqmriruvvtdbkxrqkvzp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_03GfsS-w14Wa5hlPIrOdSg_B9ixNXNZ';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
  const { error } = await supabase.from('users').insert([{ name, email }]);
  if (error && error.code !== '23505') { // Ignore duplicate email errors
    console.error(error);
    alert("Database error. Check console.");
    return;
  }

  // Update Avatar UI
  const initial = name.charAt(0).toUpperCase();
  userAvatar.textContent = initial;
  displayUserName.textContent = name;
  
  localStorage.setItem('userEmail', email);
  loginModal.classList.add('hidden'); // Hide modal
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

// 5. Chat & Database Save Logic
async function handleChatSubmit(e, formId, inputId, containerId, mode) {
  e.preventDefault();
  const input = document.getElementById(inputId);
  const text = input.value.trim();
  if (!text) return;

  // Render on screen
  const container = document.getElementById(containerId);
  container.innerHTML += `<div class="msg user"><div class="bubble">${text}</div></div>`;
  input.value = '';
  container.scrollTop = container.scrollHeight;

  // Save to Supabase
  const userEmail = localStorage.getItem('userEmail');
  const { error } = await supabase.from('chats').insert([{
    user_email: userEmail,
    mode: mode,
    role: 'user',
    message: text
  }]);

  if (error) console.error("Error saving chat:", error);
}

document.getElementById('mentorForm').addEventListener('submit', (e) => 
  handleChatSubmit(e, 'mentorForm', 'mentorInput', 'mentorMessages', 'mentor')
);

document.getElementById('generalForm').addEventListener('submit', (e) => 
  handleChatSubmit(e, 'generalForm', 'generalInput', 'generalMessages', 'general')
);