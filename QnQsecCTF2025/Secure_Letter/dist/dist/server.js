const express = require('express');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${ip} - UA: ${userAgent.substring(0, 100)}`);
  
  // Log query parameters if any
  if (Object.keys(req.query).length > 0) {
    console.log(`  Query params:`, req.query);
  }
  
  // Log body for POST requests
  if (req.method === 'POST' && Object.keys(req.body).length > 0) {
    console.log(`  Body:`, req.body);
  }
  
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

if (!global.letters) {
  global.letters = new Map();
}

if (!global.sharedLetters) {
  global.sharedLetters = new Map();
}

const escapeHtml = (html) => {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const renderTemplate = (templatePath, variables) => {
  try {
    const template = fs.readFileSync(templatePath, 'utf8');
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  } catch (error) {
    console.error('Error reading template:', error);
    return '<h1>Error loading template</h1>';
  }
};

app.get('/letter', (req, res) => {
  const content = req.query.content || 'Write your letter here...';
  
  const letterHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Your Letter</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(to bottom right, #fef3c7, #fde68a);
            min-height: 100vh;
        }
        .letter-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: 1px solid #e5e7eb;
        }
        .letter-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #d1d5db;
            padding-bottom: 20px;
        }
        .letter-content {
            line-height: 1.8;
            font-size: 16px;
            color: #374151;
            white-space: pre-wrap;
        }
        .letter-signature {
            margin-top: 30px;
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="letter-container">
        <div class="letter-header">
            <h2>📮 Personal Letter</h2>
        </div>
        <div class="letter-content">${content}</div>
        <div class="letter-signature">
            <p><em>Written with love ❤️</em></p>
        </div>
    </div>
</body>
</html>`;
  
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(letterHtml);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'letter-writer.html'));
});

app.post('/api/letter', (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Letter content is required"
      });
    }

    const letterId = Date.now().toString();
    const letterData = {
      content: escapeHtml(content),
      timestamp: Date.now()
    };

    global.letters.set(letterId, letterData);

    const response = {
      success: true,
      message: "Letter saved successfully",
      data: { letterId, timestamp: letterData.timestamp }
    };

    res.json(response);
  } catch (error) {
    const response = {
      success: false,
      message: "Failed to save letter",
      error: error instanceof Error ? error.message : "Unknown error"
    };
    res.status(500).json(response);
  }
});

app.get('/api/letter/:id', (req, res) => {
  try {
    const { id } = req.params;
    const letter = global.letters.get(id);

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Letter not found"
      });
    }

    const response = {
      success: true,
      message: "Letter retrieved successfully",
      data: letter
    };

    res.json(response);
  } catch (error) {
    const response = {
      success: false,
      message: "Failed to retrieve letter",
      error: error instanceof Error ? error.message : "Unknown error"
    };
    res.status(500).json(response);
  }
});

app.get('/api/letters', (req, res) => {
  try {
    const letters = Array.from(global.letters.entries()).map(([id, data]) => ({
      id,
      ...data
    }));

    const response = {
      success: true,
      message: "Letters retrieved successfully",
      data: letters
    };

    res.json(response);
  } catch (error) {
    const response = {
      success: false,
      message: "Failed to retrieve letters",
      error: error instanceof Error ? error.message : "Unknown error"
    };
    res.status(500).json(response);
  }
});

app.post('/api/create-letter', (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Letter content is required"
      });
    }

    const hash = Math.random().toString(36).substring(2, 15);
    const letterData = {
      content: content,
      timestamp: Date.now()
    };

    global.sharedLetters.set(hash, letterData);

    const response = {
      success: true,
      message: "Letter created successfully",
      data: { hash, url: `/letter/${hash}` }
    };

    res.json(response);
  } catch (error) {
    const response = {
      success: false,
      message: "Failed to create letter",
      error: error instanceof Error ? error.message : "Unknown error"
    };
    res.status(500).json(response);
  }
});

app.get('/letter/:hash', (req, res) => {
  try {
    const { hash } = req.params;
    const letter = global.sharedLetters.get(hash);

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Letter not found"
      });
    }

    const templatePath = path.join(__dirname, 'public', 'letter-template.html');
    const html = renderTemplate(templatePath, {
      timestamp: new Date(letter.timestamp).toLocaleString(),
      letterContent: `<h1>Letter</h1><p>${escapeHtml(letter.content)}</p>`
    });
    
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(html);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve letter",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.get('/report', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'report.html'));
});

app.post('/api/report', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required"
      });
    }

    const botUrl = `http://${process.env.BOT_HOST || 'bot'}:3002/report?url=${encodeURIComponent(url)}`;
    const response = await fetch(botUrl);
    const result = await response.json();

    res.json({
      success: true,
      message: "Report sent to bot",
      botResponse: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send report to bot",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Letter Writer API is healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'letter-writer.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Letter Writer server running on port ${PORT}`);
  console.log(`📝 Visit http://localhost:${PORT} to start writing letters`);
  console.log(`📡 WebSocket server ready for connections`);
});
