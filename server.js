const http = require('http');
const fs = require('fs');
const path = require('path');

// Prevent unhandled rejections / exceptions from crashing the process
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

const PORT = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

async function handleAgentAPI(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', async () => {
    try {
      const { message } = JSON.parse(body);

      if (!message) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Message is required' }));
        return;
      }

      if (!process.env.OPENAI_API_KEY) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'AI service not configured' }));
        return;
      }

      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const systemPrompt = `You are a helpful AI voice assistant for Blink Beyond, a digital marketing agency based in Palghar, Maharashtra, India. 
You help visitors navigate the website and learn about services including web development, social media management, branding, and performance marketing.
Keep responses concise and conversational — they will be spoken aloud.

You can also issue navigation or scroll commands by including a "surfCommand" in your JSON response.

Available pages: / (home), /about.html (about us), /services.html (services), /contact.html (contact)
Available scroll targets (CSS selectors): #hero, #services, #about, #contact, footer

Always respond in this exact JSON format:
{
  "response": "Your spoken response here",
  "surfCommand": { "action": "navigate", "target": "/page.html" }
}
OR if no navigation/scroll needed:
{
  "response": "Your spoken response here"
}

For scroll actions use: { "action": "scroll", "target": "#section-id" }`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 300
      });

      const result = JSON.parse(completion.choices[0].message.content);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));

    } catch (err) {
      console.error('Agent API error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/agent') {
    return handleAgentAPI(req, res);
  }

  const rawPath = req.url.split('?')[0];
  const resolved = path.join(__dirname, rawPath === '/' ? 'index.html' : rawPath);

  // Prevent directory traversal outside the web root
  if (!resolved.startsWith(__dirname + path.sep) && resolved !== __dirname) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  function serveFile(targetPath) {
    const extname = String(path.extname(targetPath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(targetPath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT' && !path.extname(targetPath)) {
          // Try adding .html extension
          const htmlPath = targetPath + '.html';
          if (fs.existsSync(htmlPath)) {
            return serveFile(htmlPath);
          }
        }
        
        fs.readFile(path.join(__dirname, '404.html'), (err404, content404) => {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content404 || '404 Not Found', 'utf-8');
        });
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  }

  fs.stat(resolved, (statErr, stats) => {
    if (!statErr && stats.isDirectory()) {
      const indexPath = path.join(resolved, 'index.html');
      serveFile(indexPath);
    } else {
      serveFile(resolved);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Blink Beyond Server running at http://localhost:${PORT}/`);
});
