#!/usr/bin/env node
/* Simple mock API for local testing
   - POST /api/login  -> accepts any username/password, returns a token
   - GET  /api/user   -> requires Authorization: Bearer <token>
   - POST /api/logout -> invalidates token
*/
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// In-memory token store
let tokens = new Set();

app.post('/api/login', (req, res) => {
  const { username, password, account } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }
  // Issue a fake token
  const token = 'mocktoken-' + Math.random().toString(36).slice(2, 10);
  tokens.add(token);
  return res.json({ token, user: { email: username, account: account || 'tenant', name: 'Demo User' } });
});

app.get('/api/user', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/, '');
  if (!token || !tokens.has(token)) return res.status(401).json({ error: 'unauthorized' });
  return res.json({ email: 'demo@local', name: 'Demo User' });
});

app.post('/api/logout', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/, '');
  if (token && tokens.has(token)) tokens.delete(token);
  return res.json({ ok: true });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Mock API listening on port', port));
