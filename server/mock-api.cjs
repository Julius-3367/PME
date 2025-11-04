#!/usr/bin/env node
/* Simple mock API for local testing (CommonJS) */
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

let tokens = new Set();

app.post('/api/login', (req, res) => {
  const { username, password, account } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }
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

// Return a list of roles supported by this instance
app.get('/api/roles', (req, res) => {
  // require onboarding token in header 'x-onboarding-token' unless ?public=true
  const allowPublic = req.query && req.query.public === 'true';
  if (!allowPublic) {
    const token = req.headers['x-onboarding-token'] || '';
    if (!token || token !== 'onboard-secret') {
      return res.status(401).json({ error: 'onboarding token required' });
    }
  }
  // example roles
  const roles = ['tenant', 'admin', 'manager', 'user', 'client'];
  return res.json({ roles });
});

app.post('/api/logout', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/, '');
  if (token && tokens.has(token)) tokens.delete(token);
  return res.json({ ok: true });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log('Mock API listening on port', port));
