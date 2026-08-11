// FLM TV — "Forgot Password" step 2: complete the reset
// Verifies the signed token from the email link, then force-sets the new
// password on the Jellyfin account using the admin key. Runs server-side
// on Netlify.
//
// Netlify env vars required (in addition to JELLYFIN_API_KEY):
//   RESET_TOKEN_SECRET = same value used in jellyfin-forgot-password.js

const crypto = require('crypto');

const JELLYFIN_SERVER = 'https://flmtv26.duckdns.org:8920';

function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

function verifyToken(token, secret) {
  const [payload, sig] = (token || '').split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(b64urlDecode(payload));
    if (!data.exp || Date.now() > data.exp) return null; // expired
    return data;
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const ADMIN_API_KEY = process.env.JELLYFIN_API_KEY;
  const RESET_SECRET = process.env.RESET_TOKEN_SECRET;
  if (!ADMIN_API_KEY || !RESET_SECRET) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured: missing required environment variables' }) };
  }

  let token, newPassword;
  try {
    ({ token, newPassword } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!token || !newPassword) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing token or new password' }) };
  }
  if (newPassword.length < 6) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Password must be at least 6 characters' }) };
  }

  const data = verifyToken(token, RESET_SECRET);
  if (!data) {
    return { statusCode: 400, body: JSON.stringify({ error: 'This reset link is invalid or has expired. Please request a new one.' }) };
  }

  const authHeader = `MediaBrowser Token="${ADMIN_API_KEY}"`;

  try {
    // Admin password reset is a two-step Jellyfin API call:
    // 1) clear the existing password, 2) set the new one.
    const clearRes = await fetch(`${JELLYFIN_SERVER}/Users/${data.uid}/Password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
      body: JSON.stringify({ ResetPassword: true })
    });
    if (!clearRes.ok) {
      const detail = await clearRes.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'Could not reset password on the server.', detail }) };
    }

    const setRes = await fetch(`${JELLYFIN_SERVER}/Users/${data.uid}/Password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
      body: JSON.stringify({ CurrentPw: '', NewPw: newPassword })
    });
    if (!setRes.ok) {
      const detail = await setRes.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'Could not set new password on the server.', detail }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error', detail: err.message }) };
  }
};
