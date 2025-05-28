const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = 3006;

app.use(cors());

app.use(express.json());

app.post("/convert", upload.single("pdf"), (req, res) => {
  const file = req.file;
  const outputPath = path.join(__dirname, "outputs", `${file.filename}.html`);

  const command = `pdf2htmlEX "${file.path}" "${outputPath}"`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error("Conversion error:", stderr);
      return res.status(500).json({ error: "Conversion failed." });
    }

    const html = fs.readFileSync(outputPath, "utf-8");

    // Clean up
    fs.unlinkSync(file.path);
    fs.unlinkSync(outputPath);

    res.set("Content-Type", "text/html");
    res.send(html);
  });
});

app.listen(PORT, () => {
  console.log(`PDF-to-HTML API running on http://localhost:${PORT}`);
});
