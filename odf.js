// server.js

const express = require('express');                                              // web.run—Multer middleware overview :contentReference[oaicite:0]{index=0}
const multer = require('multer');                                                // web.run—Multer features & usage :contentReference[oaicite:1]{index=1}
const { exec } = require('child_process');                                        // Node.js child_process docs :contentReference[oaicite:2]{index=2}
const fs = require('fs');                                                         // Node.js fs module basics :contentReference[oaicite:3]{index=3}
const path = require('path');                                                     // Node.js path module basics :contentReference[oaicite:4]{index=4}

const app = express();
const PORT = 5004;

// Multer setup — store uploads in ./uploads with original filename preserved
const upload = multer({
  dest: 'uploads/',
  preservePath: true,
});

// Simple request logger
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});

// PDF → XML conversion endpoint
app.post('/convert', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No PDF file uploaded.' });  // input validation :contentReference[oaicite:5]{index=5}
  }

  const pdfPath = req.file.path;
  const baseName = path.parse(req.file.originalname).name;                           // derive base name from original file :contentReference[oaicite:6]{index=6}
  const outputDir = path.join(__dirname, 'xml');
  const xmlOutputPath = path.join(outputDir, `${baseName}.xml`);                     // explicit XML filename

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });                                   // safe mkdir :contentReference[oaicite:7]{index=7}
  }

  // Build pdftohtml command
  // -xml: produce XML; -nodrm: override PDF DRM :contentReference[oaicite:8]{index=8}
  const cmd = `pdftohtml -xml -nodrm "${pdfPath}" "${xmlOutputPath}"`;

  console.log(`Running command: ${cmd}`);

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error('Conversion error:', stderr || err.message);
      return res.status(500).json({ success: false, message: 'PDF → XML conversion failed.' });
    }

    // Verify XML was created
    if (!fs.existsSync(xmlOutputPath)) {
      console.error('Expected XML not found at', xmlOutputPath);
      return res.status(500).json({ success: false, message: 'XML file not created.' });
    }

    // Send XML for download
    res.download(xmlOutputPath, `${baseName}.xml`, downloadErr => {
      if (downloadErr) console.error('Download error:', downloadErr.message);

      // Cleanup both PDF and XML
      [pdfPath, xmlOutputPath].forEach(file => {
        fs.unlink(file, unlinkErr => {
          if (unlinkErr) console.warn('Cleanup warning for', file, unlinkErr.message);
        });
      });
    });
  });
});

// Health check
app.get('/', (req, res) => {
  res.send('PDF→XML conversion server is up and running!');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);                         // listening on all interfaces :contentReference[oaicite:9]{index=9}
});
