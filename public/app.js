const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const messagesEl = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const sendButton = document.getElementById("sendButton");
const historyEl = document.getElementById("history");
const sidebar = document.getElementById("sidebar");

let messages = [];
let chats = [];
let busy = false;

function resizeInput() {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 180) + "px";
}
input.addEventListener("input", resizeInput);

function renderMessages() {
  welcome.style.display = messages.length ? "none" : "flex";
  messagesEl.innerHTML = "";
  messages.forEach((message, index) => {
    const row = document.createElement("div");
    row.className = "message " + message.role;
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = message.role === "user" ? "אתה" : "א";
    const content = document.createElement("div");
    content.className = "bubble";
    content.textContent = message.content;
    row.appendChild(avatar);
    row.appendChild(content);
    if (message.role === "assistant") {
      const actions = document.createElement("div");
      actions.className = "message-actions";
      const copy = document.createElement("button");
      copy.className = "copy-button";
      copy.textContent = "העתק תשובה";
      copy.addEventListener("click", function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(message.content).then(() => { copy.textContent = "הועתק!"; }).catch(() => { copy.textContent = "לא ניתן להעתיק"; });
        } else {
          copy.textContent = "העתקה אינה נתמכת בדפדפן";
        }
      });
      actions.appendChild(copy);
      content.appendChild(actions);
    }
    messagesEl.appendChild(row);
  });
  messagesEl.scrollTop = messagesEl.scrollHeight;
  document.getElementById("conversation").scrollTop = document.getElementById("conversation").scrollHeight;
}

function showTyping() {
  const row = document.createElement("div");
  row.className = "message";
  row.id = "typing";
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "א";
  const dots = document.createElement("div");
  dots.className = "typing";
  dots.innerHTML = "<i></i><i></i><i></i>";
  row.appendChild(avatar);
  row.appendChild(dots);
  messagesEl.appendChild(row);
}

function renderHistory() {
  historyEl.innerHTML = "";
  chats.forEach((chat, index) => {
    const button = document.createElement("button");
    button.className = "history-item";
    button.textContent = chat.title;
    button.addEventListener("click", function () {
      messages = chat.messages.slice();
      renderMessages();
      sidebar.classList.remove("open");
    });
    historyEl.appendChild(button);
  });
}

function saveCurrentChat() {
  if (!messages.length) return;
  const title = messages.find((m) => m.role === "user");
  chats.unshift({ title: title ? title.content.slice(0, 32) : "שיחה חדשה", messages: messages.slice() });
  chats = chats.slice(0, 12);
  renderHistory();
}

async function sendMessage(text) {
  if (busy || !text.trim()) return;
  busy = true;
  sendButton.disabled = true;
  messages.push({ role: "user", content: text.trim() });
  renderMessages();
  showTyping();
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages.map((m) => ({ role: m.role, content: m.content })) })
    });
    const data = await response.json();
    document.getElementById("typing") && document.getElementById("typing").remove();
    if (!response.ok) throw new Error(data.error || "אירעה שגיאה");
    messages.push({ role: "assistant", content: data.reply });
  } catch (error) {
    messages.push({ role: "assistant", content: "מצטער, אירעה תקלה: " + error.message });
  }
  renderMessages();
  busy = false;
  sendButton.disabled = false;
  input.focus();
}

form.addEventListener("submit", function (event) {
  event.preventDefault();
  const value = input.value;
  if (!value.trim()) return;
  input.value = "";
  resizeInput();
  sendMessage(value);
});

document.getElementById("newChat").addEventListener("click", function () {
  saveCurrentChat();
  messages = [];
  renderMessages();
  sidebar.classList.remove("open");
  input.focus();
});
document.getElementById("clearChat").addEventListener("click", function () {
  messages = [];
  renderMessages();
});
document.getElementById("mobileMenu").addEventListener("click", function () {
  sidebar.classList.toggle("open");
});
document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => sendMessage(button.getAttribute("data-prompt")));
});
renderMessages();
