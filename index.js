const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process'); 

const app = express();
const PORT = 3005;

const upload = multer({
    dest: 'uploads/', 
    limits: { fileSize: 50 * 1024 * 1024 } 
});


app.post('/convert', upload.single('pdf'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No PDF uploaded');
    }

    const inputPath = req.file.path;
    const originalName = path.parse(req.file.originalname).name;
    const outputDir = path.join(__dirname, 'xml');
    const outputPath = path.join(outputDir, originalName + '.xml');


    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Simulate PDF to XML conversion — replace this with your logic
    // Example: using `pdftohtml` CLI tool in XML mode
    // command: `pdftohtml -xml inputPath outputPath`

    const cmd = `pdftohtml -xml "${inputPath}" "${outputPath}"`; // Make sure `pdftohtml` is installed

    exec(cmd, (error) => {
        if (error) {
            console.error('Conversion error:', error);
            return res.status(500).send('Conversion failed');
        }

        // Stream the XML file back
        res.download(outputPath, originalName + '.xml', (err) => {
            if (err) {
                console.error('Error sending file:', err);
            }

            // Clean up temp files
            fs.unlinkSync(inputPath);
            // Optional: fs.unlinkSync(outputPath);
        });
    });
});

app.listen(3005, '0.0.0.0', () => {
  console.log("Server started on port 3005");
});

