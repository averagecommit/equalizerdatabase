import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const app = express();
app.set('trust proxy', true);
const port = process.env.PORT || 5000;
const { Pool } = pkg;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database (eqdb)'))
  .catch((err) => console.error('❌ Database connection error:', err.stack));

// ==========================================
// API ROUTES
// ==========================================

// 1. Get all devices for the frontend dropdown
app.get('/api/devices', async (req, res) => {
  try {
    // Fetches all devices and orders them alphabetically by brand
    const result = await pool.query('SELECT * FROM devices ORDER BY brand ASC, model ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// 2. Submit a new EQ Profile
app.post('/api/eq-profiles', async (req, res) => {
  try {
    const { device_id, submitter_name, title, description, preamp_gain, bands } = req.body;

    // Backend Sanity Check: Prevent positive preamp gain to avoid clipping
    if (preamp_gain > 0) {
      return res.status(400).json({ error: 'Preamp gain must be 0 or a negative number.' });
    }

    if (description && description.length > 50) {
      return res.status(400).json({ error: 'Description must be 50 characters or fewer.' });
    }

    const newProfile = await pool.query(
      `INSERT INTO eq_profiles (device_id, submitter_name, title, description, preamp_gain, bands) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [device_id, submitter_name, title, description || null, preamp_gain, JSON.stringify(bands)]
    );

    res.json(newProfile.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to save EQ profile' });
  }
});

// 3. Get all EQ profiles for a specific device (sorted by highest score)
app.get('/api/eq-profiles/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const result = await pool.query(
      'SELECT * FROM eq_profiles WHERE device_id = $1 ORDER BY score DESC',
      [deviceId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch EQ profiles' });
  }
});

// 4. Vote on an EQ Profile
app.post('/api/eq-profiles/:id/vote', async (req, res) => {
  const { id } = req.params;
  const { vote_value, client_id } = req.body; // vote_value: 1 (upvote) or -1 (downvote)

  // ip_address is still recorded for abuse-investigation purposes, but it no
  // longer drives dedup (see database.sql for why: shared/NAT'd IPs made it
  // unreliable for telling distinct voters apart).
  const ip_address = req.ip || req.socket.remoteAddress;

  if (![1, -1].includes(vote_value)) {
    return res.status(400).json({ error: 'Invalid vote value' });
  }

  if (typeof client_id !== 'string' || client_id.trim() === '') {
    return res.status(400).json({ error: 'Missing client_id' });
  }

  try {
    // Start a SQL Transaction (if any step fails, it rolls back everything)
    await pool.query('BEGIN');

    // Check if this client has already voted on this profile
    const existingVote = await pool.query(
      'SELECT vote_value FROM votes WHERE client_id = $1 AND eq_profile_id = $2',
      [client_id, id]
    );

    let scoreChange = 0;

    if (existingVote.rows.length > 0) {
      const currentVote = existingVote.rows[0].vote_value;
      
      if (currentVote === vote_value) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ error: 'You have already cast this vote.' });
      }
      
      // They are switching their vote (e.g., from -1 to +1, which means score goes up by 2)
      scoreChange = vote_value * 2;
      await pool.query(
        'UPDATE votes SET vote_value = $1, ip_address = $2 WHERE client_id = $3 AND eq_profile_id = $4',
        [vote_value, ip_address, client_id, id]
      );
    } else {
      // It is a brand new vote
      scoreChange = vote_value;
      await pool.query(
        'INSERT INTO votes (client_id, ip_address, eq_profile_id, vote_value) VALUES ($1, $2, $3, $4)',
        [client_id, ip_address, id, vote_value]
      );
    }

    // Apply the score change to the profile
    const updatedProfile = await pool.query(
      'UPDATE eq_profiles SET score = score + $1 WHERE id = $2 RETURNING score',
      [scoreChange, id]
    );

    await pool.query('COMMIT'); // Save the transaction
    res.json({ new_score: updatedProfile.rows[0].score });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Failed to process vote' });
  }
});

// 5. Submit a device request (user's headphone isn't in the dropdown yet)
app.post('/api/device-requests', async (req, res) => {
  try {
    const { brand, model } = req.body;

    if (!brand || !brand.trim() || !model || !model.trim()) {
      return res.status(400).json({ error: 'Brand and model are required.' });
    }

    const newRequest = await pool.query(
      `INSERT INTO device_requests (brand, model) VALUES ($1, $2) RETURNING *`,
      [brand.trim(), model.trim()]
    );

    // Fire-and-forget notification — a failed webhook should never block the
    // user's request from being saved, so this is deliberately not awaited
    // in a way that affects the response, and errors are only logged.
    if (process.env.DISCORD_WEBHOOK_URL) {
      fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🎧 New device request: **${brand.trim()} ${model.trim()}**`,
        }),
      }).catch((err) => console.error('Discord webhook failed:', err.message));
    }

    res.json(newRequest.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to submit device request' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});