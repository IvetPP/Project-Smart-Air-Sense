const express = require('express');
const crypto = require('crypto');
const supabase = require('../lib/supabase');

const router = express.Router();

const SECRET_KEY = process.env.IOT_SECRET_KEY;
const IV = process.env.IOT_IV;
const API_TOKEN = process.env.IOT_API_TOKEN;

router.post('/ingest', async (req, res) => {
  // Token verification
  const token =
    req.query.token ||
    req.headers.authorization?.replace('Bearer ', '');

  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ error: 'Invalid API token' });
  }

  const encryptedText = req.body.encrypted_data;

  if (!encryptedText || typeof encryptedText !== 'string') {
    return res.status(400).json({ error: 'Invalid encrypted payload' });
  }

  try {
    // Decrypt
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      SECRET_KEY,
      IV
    );

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const data = JSON.parse(decrypted);

    // STORE IN SUPABASE
    const { error } = await supabase
      .from('iot_data')
      .insert({
        device_id: data.device_id,
        co2: data.co2,
        temperature: data.temperature,
        humidity: data.humidity,
        pressure: data.pressure,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Database insert failed' });
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Decryption failed' });
  }
});

module.exports = router;