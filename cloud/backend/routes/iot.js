const express = require('express');
const crypto = require('crypto');

const router = express.Router();

const SECRET_KEY = process.env.IOT_SECRET_KEY;
const IV = process.env.IOT_IV;
const API_TOKEN = process.env.IOT_API_TOKEN;

router.post('/ingest', (req, res) => {
  // Ověření tokenu
  const token =
    req.query.token ||
    req.headers.authorization?.replace('Bearer ', '');

  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ error: 'Invalid API token' });
  }

  // Získání šifrovaných dat
  const encryptedText = req.body.encrypted_data;

  if (!encryptedText || typeof encryptedText !== 'string') {
    return res.status(400).json({ error: 'Invalid encrypted payload' });
  }

  try {
    // Dešifrování
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      SECRET_KEY,
      IV
    );

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const data = JSON.parse(decrypted);

    // uložit do DB
    // await Measurements.create(data);

    console.log('IoT data received:', data);

    res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Decryption failed' });
  }
});

module.exports = router;