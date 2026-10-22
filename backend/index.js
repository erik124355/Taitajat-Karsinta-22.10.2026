

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('node:fs/promises');
const path = require('node:path');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const EVENTS_FILE = path.join(__dirname, 'tapahtumat.json');

app.use(cors());
app.use(express.json());

// Get all events from the JSON file
app.get('/api/tapahtumat', async (req, res) => {
  try {
    const fileContents = await fs.readFile(EVENTS_FILE, 'utf8');
    const tapahtumat = JSON.parse(fileContents);

    if (!Array.isArray(tapahtumat)) {
      return res.status(500).json({
        message: 'tapahtumat.json must contain an array of events.',
      });
    }

    res.json(tapahtumat);
  } catch (error) {
    console.error('Error reading tapahtumat.json:', error);

    res.status(500).json({
      message: 'Tapahtumien lataaminen epäonnistui.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
