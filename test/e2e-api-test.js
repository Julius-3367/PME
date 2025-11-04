/* Minimal end-to-end test that boots the mock API (if not running) and runs login/getUser/logout flows.
   Run with: node test/e2e-api-test.js
*/
const { spawn } = require('child_process');
const fetch = require('node-fetch');
const path = require('path');

async function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function run(){
  // Try to contact mock API first
  const base = process.env.API_BASE || 'http://localhost:3000';
  try{
    const r = await fetch(base + '/api/login', { method: 'OPTIONS' });
    // if no error, proceed
  } catch(e){
    console.log('Starting local mock API...');
    const server = spawn(process.execPath, [path.join(__dirname,'..','server','mock-api.js')], { stdio: 'inherit' });
    // give server a moment to start
    await wait(500);
  }

  console.log('Running E2E API flow against', base);
  const creds = { username: 'demo@local.test', password: 'password', account: 'tenant' };

  const loginRes = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creds) });
  if (!loginRes.ok) throw new Error('login failed: ' + loginRes.status);
  const loginJson = await loginRes.json();
  if (!loginJson.token) throw new Error('no token returned');
  console.log('login OK, token:', loginJson.token);

  const token = loginJson.token;
  const userRes = await fetch(base + '/api/user', { method: 'GET', headers: { Authorization: 'Bearer ' + token } });
  if (!userRes.ok) throw new Error('getUser failed: ' + userRes.status);
  console.log('getUser OK');

  const logoutRes = await fetch(base + '/api/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
  if (!logoutRes.ok) throw new Error('logout failed: ' + logoutRes.status);
  console.log('logout OK');

  console.log('E2E API test passed');
}

run().catch(e=>{ console.error('E2E test failed:', e); process.exit(1); });
