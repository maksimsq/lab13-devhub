const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing for API requests
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// CORS-Proxy Endpoint for PostmanLite Client
app.post('/api/proxy', async (req, res) => {
  const { url, method, headers, body } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Missing target request URL.' });
  }

  // Validate URL protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return res.status(400).json({ error: 'Invalid URL. Protocol must be http:// or https://' });
  }

  const startTime = Date.now();

  try {
    const fetchOptions = {
      method: method || 'GET',
      headers: headers || {}
    };

    // Only forward body for appropriate HTTP methods
    if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      fetchOptions.body = typeof body === 'object' ? JSON.stringify(body) : body;
    }

    // Perform external fetch
    const response = await fetch(url, fetchOptions);
    const duration = Date.now() - startTime;

    // Collect response headers
    const responseHeaders = {};
    response.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    // Read body text or json safely
    let responseData = '';
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = await response.text();
      }
    } else {
      responseData = await response.text();
    }

    // Estimate payload size in bytes
    const bodyStr = typeof responseData === 'object' ? JSON.stringify(responseData) : String(responseData);
    const sizeBytes = Buffer.byteLength(bodyStr, 'utf8');

    res.json({
      status: response.status,
      statusText: response.statusText || 'OK',
      headers: responseHeaders,
      body: responseData,
      duration: duration,
      size: sizeBytes
    });

  } catch (error) {
    console.error(`CORS Proxy failed for ${url}:`, error.message);
    res.status(500).json({
      error: 'Proxy request failed',
      message: error.message,
      duration: Date.now() - startTime
    });
  }
});

// Fallback to index.html for SPA behavior
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Developer Hub Proxy running on port ${PORT}`);
  console.log(`🏠 Local URL: http://localhost:${PORT}`);
  console.log(`===============================================`);
});
