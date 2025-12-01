// ====================
// Configuration
// ====================
const WS_URL = "ws://localhost:5000/status"; // WebSocket URL
let ws = null;
let useMock = true; // true = mock data, false = real WS

// ====================
// DOM Elements
// ====================
const mainCountEl = document.getElementById("mainCount");
const corridorCountEl = document.getElementById("corridorCount");
const ambCountEl = document.getElementById("ambCount");
const violationStatusEl = document.getElementById("violationStatus");
const latencyEl = document.getElementById("latency");
const over2El = document.getElementById("over2");
const co2El = document.getElementById("co2");
const corridorStatusEl = document.getElementById("corridorStatus");
const violationBox = document.getElementById("violationBox");
const corridorOpenBox = document.getElementById("corridorOpenBox");
const mockToggleBtn = document.getElementById("mockToggle");

// ====================
// Functions
// ====================

// Update UI with latest data
function updateUI(data) {
  mainCountEl.textContent = data.main;
  corridorCountEl.textContent = data.corridor;
  ambCountEl.textContent = data.amb;

  violationStatusEl.textContent = data.amb_violation ? "YES" : "NO";
  violationBox.style.backgroundColor = data.amb_violation ? "#ef4444" : "#f87171";

  latencyEl.textContent = data.latency.toFixed(2);
  over2El.textContent = data.over2pct + " %";
  co2El.textContent = data.co2.toFixed(2);

  corridorStatusEl.textContent = data.corridor_open ? "OPEN" : "CLOSED";
  corridorOpenBox.style.backgroundColor = data.corridor_open ? "#10b981" : "#34d399";

  // Recommendation
  if (data.main > 8) {
    corridorStatusEl.textContent += " → Recommend Green Corridor";
  }
}

// WebSocket connection
function connectWS() {
  if (ws) {
    try { ws.close(); } catch(e) {}
  }

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log("WebSocket connected");
  };

  ws.onclose = () => {
    console.log("WebSocket disconnected");
    useMock = true; // fallback to mock if WS closed
  };

  ws.onerror = (err) => {
    console.log("WebSocket error:", err);
    useMock = true;
  };

  ws.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data);
      updateUI(data);
    } catch (e) {
      console.log("Invalid data received:", evt.data);
    }
  };
}

// Generate mock data (for testing without backend)
function generateMockData() {
  const main = Math.max(0, Math.round(10 + 5*Math.sin(Date.now()/5000) + (Math.random()*3-1.5)));
  const corridor = Math.max(0, Math.round(Math.random()*3));
  const amb = Math.random() < 0.05 ? 1 : 0;
  const amb_violation = Math.random() < 0.02;
  const latency = 0.9 + Math.random()*0.6;
  const over2pct = Math.random() < 0.02 ? 3 : 0.8;
  const co2 = main * 2.31; // simple model: vehicles * emission factor
  const corridor_open = main > 8;

  return {main, corridor, amb, amb_violation, latency, over2pct, co2, corridor_open};
}

// Periodic update loop
setInterval(() => {
  if (useMock) {
    const data = generateMockData();
    updateUI(data);
  } else if (!ws || ws.readyState !== WebSocket.OPEN) {
    try { connectWS(); } catch(e) {}
  }
}, 1000);

// Toggle Mock Data
mockToggleBtn.addEventListener("click", () => {
  useMock = !useMock;
  mockToggleBtn.textContent = useMock ? "Use Mock Data" : "Use Real Data";
  console.log("Mock data", useMock ? "enabled" : "disabled");
});

// Initial connection attempt
try {
  connectWS();
} catch(e) {
  console.log("Initial WebSocket connection failed, using mock data.");
  useMock = true;
}
