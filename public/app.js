// ----------------------------------------------------
// TAB & ROUTING MANAGEMENT
// ----------------------------------------------------

function switchTab(tabId) {
  // Hide all tabs
  document.querySelectorAll('.content-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Deactivate all nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Activate selected tab and button
  const selectedTab = document.getElementById(`tab-${tabId}`);
  const selectedBtn = document.getElementById(`nav-btn-${tabId}`);
  
  if (selectedTab && selectedBtn) {
    selectedTab.classList.add('active');
    selectedBtn.classList.add('active');
  }
}

function switchReqTab(tabId) {
  // Hide req tab contents
  document.querySelectorAll('.req-tab-content').forEach(c => {
    c.classList.remove('active');
  });
  // Deactivate req tab buttons
  document.querySelectorAll('.req-tab-btn').forEach(b => {
    b.classList.remove('active');
  });

  // Show selected
  document.getElementById(`req-tab-content-${tabId}`).classList.add('active');
  document.getElementById(`req-tab-btn-${tabId}`).classList.add('active');
}

// ----------------------------------------------------
// DYNAMIC HEADERS ROW MANAGEMENT
// ----------------------------------------------------

function addHeaderRow(key = '', val = '') {
  const container = document.getElementById('headers-list');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'header-row';
  row.innerHTML = `
    <input type="text" class="header-key" placeholder="Key" value="${escapeHtml(key)}">
    <input type="text" class="header-value" placeholder="Value" value="${escapeHtml(val)}">
    <button class="btn btn-sm btn-remove-header" onclick="removeHeaderRow(this)">&times;</button>
  `;
  container.appendChild(row);
}

function removeHeaderRow(button) {
  const row = button.parentNode;
  row.parentNode.removeChild(row);
}

// ----------------------------------------------------
// API REQUEST & PROXY LOGIC (POSTMAN LITE)
// ----------------------------------------------------

async function sendApiRequest() {
  const method = document.getElementById('req-method').value;
  const url = document.getElementById('req-url').value.trim();
  const bodyText = document.getElementById('req-body-content').value;
  const responseWrapper = document.getElementById('response-content-wrapper');
  const metaInfo = document.getElementById('res-meta-info');
  const sendBtn = document.getElementById('btn-send-req');

  if (!url) {
    alert('Please enter a valid URL.');
    return;
  }

  // 1. Gather headers from dynamic list
  const headers = {};
  document.querySelectorAll('.header-row').forEach(row => {
    const key = row.querySelector('.header-key').value.trim();
    const val = row.querySelector('.header-value').value.trim();
    if (key) {
      headers[key] = val;
    }
  });

  // 2. Prepare body payload if needed
  let bodyPayload = null;
  if (bodyText && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    try {
      // Validate JSON structure if present
      bodyPayload = JSON.parse(bodyText);
    } catch (e) {
      bodyPayload = bodyText; // Fallback to raw text
    }
  }

  // 3. Set loading state
  sendBtn.disabled = true;
  sendBtn.innerText = 'Sending...';
  metaInfo.style.display = 'none';
  responseWrapper.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p style="margin-top: 1rem;">Proxying request to target host...</p>
    </div>
  `;

  try {
    const proxyResponse = await fetch('/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        method,
        headers,
        body: bodyPayload
      })
    });

    const data = await proxyResponse.json();
    
    // 4. Handle success/error from proxy
    if (!proxyResponse.ok) {
      throw new Error(data.message || 'Unknown server error during proxying.');
    }

    // 5. Update response metadata badges
    document.getElementById('res-time').innerText = `${data.duration} ms`;
    document.getElementById('res-size').innerText = formatBytes(data.size);
    
    const statusEl = document.getElementById('res-status');
    statusEl.innerText = `${data.status} ${data.statusText}`;
    statusEl.className = 'res-status-badge ' + (data.status >= 200 && data.status < 300 ? 'status-success' : 'status-error');
    metaInfo.style.display = 'flex';

    // 6. Format and display response payload
    let prettyBody = '';
    if (typeof data.body === 'object') {
      prettyBody = JSON.stringify(data.body, null, 2);
    } else {
      prettyBody = String(data.body);
    }

    // Response Headers layout
    let headersHTML = Object.entries(data.headers).map(([k, v]) => {
      return `<tr><td><strong>${escapeHtml(k)}:</strong></td><td>${escapeHtml(v)}</td></tr>`;
    }).join('');

    responseWrapper.innerHTML = `
      <div class="res-tabs-container">
        <div class="res-tabs-nav">
          <button class="res-tab-btn active" id="res-tab-btn-body" onclick="switchResTab('body')">Response Body</button>
          <button class="res-tab-btn" id="res-tab-btn-headers" onclick="switchResTab('headers')">Headers</button>
        </div>
        <div class="res-tab-content active" id="res-tab-content-body">
          <div class="output-copy-box" style="margin-bottom: 0.5rem; justify-content: flex-end;">
            <button class="btn btn-sm" onclick="copyResponseBody()">Copy Response</button>
          </div>
          <pre><code id="res-raw-code" class="font-mono">${escapeHtml(prettyBody)}</code></pre>
        </div>
        <div class="res-tab-content" id="res-tab-content-headers">
          <table class="res-headers-table font-mono">
            <tbody>
              ${headersHTML || '<tr><td colspan="2">No response headers returned.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // 7. Save this request to localStorage history
    saveToHistory(url, method, headers, bodyText);

  } catch (error) {
    responseWrapper.innerHTML = `
      <div class="error-state">
        <h3>Request Failure</h3>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `;
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerText = 'Send';
  }
}

function switchResTab(tabId) {
  document.querySelectorAll('.res-tab-content').forEach(c => {
    c.classList.remove('active');
  });
  document.querySelectorAll('.res-tab-btn').forEach(b => {
    b.classList.remove('active');
  });
  document.getElementById(`res-tab-content-${tabId}`).classList.add('active');
  document.getElementById(`res-tab-btn-${tabId}`).classList.add('active');
}

function copyResponseBody() {
  const codeEl = document.getElementById('res-raw-code');
  if (!codeEl) return;

  navigator.clipboard.writeText(codeEl.innerText)
    .then(() => {
      alert('Response body copied to clipboard!');
    })
    .catch(err => {
      console.error('Clipboard copy failed:', err);
    });
}

// ----------------------------------------------------
// LOCAL REQUEST HISTORY MANAGEMENT
// ----------------------------------------------------

function saveToHistory(url, method, headers, body) {
  let history = JSON.parse(localStorage.getItem('api_history') || '[]');
  
  // Avoid duplicate entries of the same URL & Method at the top
  history = history.filter(item => !(item.url === url && item.method === method));

  // Add to top of list
  history.unshift({ url, method, headers, body, timestamp: new Date().toLocaleTimeString() });

  // Limit history length to 15 items
  if (history.length > 15) {
    history.pop();
  }

  localStorage.setItem('api_history', JSON.stringify(history));
  loadHistory();
}

function loadHistory() {
  const container = document.getElementById('history-list-box');
  if (!container) return;

  const history = JSON.parse(localStorage.getItem('api_history') || '[]');
  
  if (history.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 1.5rem; font-size: 0.8rem;">
        No request history.
      </div>
    `;
    return;
  }

  container.innerHTML = history.map((item, idx) => {
    let badgeClass = 'get';
    if (item.method === 'POST') badgeClass = 'post';
    if (item.method === 'PUT') badgeClass = 'put';
    if (item.method === 'DELETE') badgeClass = 'delete';

    return `
      <div class="history-item" onclick="loadRequestFromHistory(${idx})">
        <div class="history-left">
          <span class="history-badge ${badgeClass}">${item.method}</span>
          <span class="history-url" title="${escapeHtml(item.url)}">${escapeHtml(item.url)}</span>
        </div>
        <button class="history-del-btn" onclick="deleteHistoryItem(${idx}, event)">&times;</button>
      </div>
    `;
  }).join('');
}

function loadRequestFromHistory(index) {
  const history = JSON.parse(localStorage.getItem('api_history') || '[]');
  const item = history[index];
  if (!item) return;

  document.getElementById('req-method').value = item.method;
  document.getElementById('req-url').value = item.url;
  document.getElementById('req-body-content').value = item.body || '';

  // Re-populate dynamic headers inputs
  const headersList = document.getElementById('headers-list');
  headersList.innerHTML = '';
  
  if (item.headers && Object.keys(item.headers).length > 0) {
    Object.entries(item.headers).forEach(([k, v]) => {
      addHeaderRow(k, v);
    });
  } else {
    // Add default blank header row if empty
    addHeaderRow();
  }
}

function deleteHistoryItem(index, event) {
  event.stopPropagation(); // Stop parent click trigger
  let history = JSON.parse(localStorage.getItem('api_history') || '[]');
  history.splice(index, 1);
  localStorage.setItem('api_history', JSON.stringify(history));
  loadHistory();
}

function clearRequestHistory() {
  localStorage.removeItem('api_history');
  loadHistory();
}

// ----------------------------------------------------
// JWT DECODER UTILITY
// ----------------------------------------------------

function decodeJwt() {
  const token = document.getElementById('jwt-raw-input').value.trim();
  const headerOutput = document.getElementById('jwt-header-output');
  const payloadOutput = document.getElementById('jwt-payload-output');

  if (!token) {
    headerOutput.innerText = 'Waiting for token...';
    payloadOutput.innerText = 'Waiting for token...';
    return;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    headerOutput.innerText = 'Error: Invalid JWT structure (must have 3 dots).';
    payloadOutput.innerText = 'Error: Check token syntax.';
    return;
  }

  try {
    const headerDecoded = base64DecodeUnicode(parts[0]);
    const payloadDecoded = base64DecodeUnicode(parts[1]);

    const headerObj = JSON.parse(headerDecoded);
    const payloadObj = JSON.parse(payloadDecoded);

    headerOutput.innerText = JSON.stringify(headerObj, null, 2);
    payloadOutput.innerText = JSON.stringify(payloadObj, null, 2);

  } catch (err) {
    headerOutput.innerText = 'Error parsing base64 components.';
    payloadOutput.innerText = err.message;
  }
}

// Helper: Secure Unicode Base64 decode
function base64DecodeUnicode(str) {
  // Replace character set for URL-safe base64 tokens
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const percentStr = Array.from(raw).map(c => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join('');
  return decodeURIComponent(percentStr);
}

// ----------------------------------------------------
// URL ENCODER/DECODER UTILITY
// ----------------------------------------------------

function processUrlEncode(isEncode) {
  const input = document.getElementById('url-input').value;
  const outputEl = document.getElementById('url-output');

  if (!input) {
    outputEl.value = '';
    return;
  }

  try {
    if (isEncode) {
      outputEl.value = encodeURIComponent(input);
    } else {
      outputEl.value = decodeURIComponent(input);
    }
  } catch (err) {
    outputEl.value = `Conversion Error: ${err.message}`;
  }
}

// ----------------------------------------------------
// HELPERS
// ----------------------------------------------------

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  // Load local request history
  loadHistory();

  // Load a single blank header row by default
  addHeaderRow();
});
