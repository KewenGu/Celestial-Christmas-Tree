import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
console.log('🔍 Checking dist directory:', distPath);
console.log('📁 Dist exists?', fs.existsSync(distPath));

if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath);
  console.log('📂 Files in dist:', files);
} else {
  console.error('❌ ERROR: dist directory not found!');
  console.error('💡 Make sure to run "npm run build" before starting the server');
}

// Serve static files from the dist directory
app.use(express.static(distPath, {
  maxAge: '1d',
  etag: true
}));

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    distExists: fs.existsSync(distPath)
  });
});

// Handle client-side routing
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  console.log('📄 Serving:', req.path);
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error('❌ index.html not found at:', indexPath);
    res.status(500).send('Build files not found. Please check server logs.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎄 Celestial Christmas Tree is running on port ${PORT}`);
  console.log(`🌟 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Server started at: ${new Date().toISOString()}`);
});

